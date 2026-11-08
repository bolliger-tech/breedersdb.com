import type { Locator, Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { walkToForm } from './support/attribute-flow';
import {
  escapeRegExp,
  expectDialogClosed,
  formField,
  listRow,
  save,
} from './support/locators';
import {
  addBaseFilterRule,
  addResultColumn,
  openAnalyzePage,
} from './support/analyze';

// ATTACHMENT values: uploaded on save, linked on the entity view under a
// generated name
// (<attribute>_<entity>_<date>.<ext>, see ADR 0002).

const downloadName = (attribute: string, entity: string, date: string) =>
  `${attribute.replace(/\s+/g, '-')}_${entity.replace(/\s+/g, '-')}_${date}`;

test('attachments are uploaded and linked on the entity view', async ({
  page,
  request,
  seed,
}) => {
  const pdfAttribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const csvAttribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const form = await seed.attributionForm([
    { id: pdfAttribute.id },
    { id: csvAttribute.id },
  ]);
  const cultivar = await seed.cultivar();
  const uid = seed.uid();

  await walkToForm(page, form.name, cultivar.display_name);
  for (const [attribute, file] of [
    [
      pdfAttribute,
      {
        name: 'report.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(`%PDF-1.4\n% e2e ${uid}\n`),
      },
    ],
    [
      csvAttribute,
      {
        name: 'data.csv',
        mimeType: 'text/csv',
        buffer: Buffer.from(`a,b\n1,${uid}\n`),
      },
    ],
  ] as const) {
    const field = formField(page, attribute.name);
    await field.locator('input[type="file"]').setInputFiles(file);
    await expect(field).toContainText(file.name);
  }
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );

  await page.goto(`/#/cultivars/${cultivar.id}`);
  const dialog = page.locator('.q-dialog');
  await expect(dialog.getByRole('heading', { level: 2 })).toContainText(
    cultivar.display_name,
  );

  for (const [attribute, ext, disposition] of [
    [pdfAttribute, 'pdf', /^inline;/],
    [csvAttribute, 'csv', /^attachment;/],
  ] as const) {
    // the value cell of the attribute's table row
    const valueLink = dialog
      .locator('.entity-related-table tr')
      .filter({ hasText: attribute.name })
      .locator('a[href*="/api/assets/attachments/"]');
    await expect(valueLink).toHaveCount(1);
    await expect(valueLink).toHaveAttribute('target', '_blank');
    await expect(valueLink).toHaveAttribute('rel', 'noopener');
    const name = escapeRegExp(
      encodeURIComponent(
        downloadName(attribute.name, cultivar.display_name, 'DATE'),
      ),
    ).replace('DATE', '\\d{4}-\\d{2}-\\d{2}');
    const href = new RegExp(
      `^/api/assets/attachments/${name}\\.${ext}\\?file=[0-9a-f]{64}\\.${ext}$`,
    );
    await expect(valueLink).toHaveAttribute('href', href);

    const response = await request.get((await valueLink.getAttribute('href'))!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toMatch(disposition);
  }
});

test('attachments larger than 16 MB are rejected before the upload', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);
  const field = formField(page, attribute.name);
  await field.locator('input[type="file"]').setInputFiles({
    name: 'huge.bin',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(16 * 1024 * 1024 + 1),
  });
  await expect(field).toContainText('The file is larger than 16 MB.');
  await expect(field).not.toContainText('huge.bin');
});

test('analyze links attachments under their generated name', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  // the file need not exist to render the link
  const fileName = `${'0'.repeat(64)}.pdf`;
  await seed.attribution({
    formId: form.id,
    cultivarId: cultivar.id,
    dateAttributed: '2025-01-01',
    values: [
      { attributeId: attribute.id, dataType: 'ATTACHMENT', value: fileName },
    ],
  });

  await openAnalyzePage(page, '/#/cultivars/analyze/new');
  await addBaseFilterRule(
    page,
    'Cultivar > Name',
    'equals',
    cultivar.display_name,
  );
  await addBaseFilterRule(
    page,
    `Attribute > ${attribute.name}`,
    'is not empty',
  );
  await addResultColumn(page, attribute.name, `Attribute > ${attribute.name}`);

  const name = `${downloadName(attribute.name, cultivar.display_name, '2025-01-01')}.pdf`;
  const link = listRow(page, cultivar.display_name).getByRole('link', {
    name,
  });
  await expect(link).toHaveAttribute(
    'href',
    `/api/assets/attachments/${encodeURIComponent(name)}?file=${fileName}`,
  );
  await expect(link).toHaveAttribute('target', '_blank');
});

// Record one attachment through the attribution form, so the file is
// really stored by the cloud-function.
async function recordAttachment(
  page: Page,
  attributeName: string,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  const field = formField(page, attributeName);
  await field.locator('input[type="file"]').setInputFiles(file);
  await expect(field).toContainText(file.name);
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification')).toContainText(
    'Attribution saved.',
  );
}

const attachmentLink = (scope: Page | Locator) =>
  scope.locator('a[href*="/api/assets/attachments/"]');

test('the edit modal keeps, replaces and clears an attachment', async ({
  page,
  request,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();
  const uid = seed.uid();

  await walkToForm(page, form.name, cultivar.display_name);
  await recordAttachment(page, attribute.name, {
    name: 'report.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\n% e2e ${uid}\n`),
  });

  const listUrl = `/#/attributions?s=${encodeURIComponent(attribute.name)}`;
  const row = listRow(page, attribute.name);
  await page.goto(listUrl);
  const pdfHref = await attachmentLink(row).getAttribute('href');
  expect(pdfHref).toMatch(/\.pdf\?file=[0-9a-f]{64}\.pdf$/);

  const openEditModal = async () => {
    await page.goto(listUrl);
    // a plain row click may land on the attachment link (opens a new tab)
    await row.getByText(attribute.name, { exact: true }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
  };
  const dialog = page.locator('.q-dialog');
  const existing = dialog.locator('.attribution-input-attachment__existing');

  // keep: changing only the note leaves the attachment as it is
  await openEditModal();
  await expect(attachmentLink(existing)).toHaveAttribute('href', pdfHref!);
  await dialog.getByRole('button', { name: 'Add note' }).click();
  await dialog.locator('textarea').fill(`note ${uid}`);
  await save(page);
  await expectDialogClosed(page);
  await page.goto(listUrl);
  await expect(row).toContainText(`note ${uid}`);
  await expect(attachmentLink(row)).toHaveAttribute('href', pdfHref!);

  // replace: the new file is uploaded and linked with its own extension
  await openEditModal();
  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'data.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(`a,b\n1,${uid}\n`),
  });
  await save(page);
  await expectDialogClosed(page);
  await page.goto(listUrl);
  const csvHref = await attachmentLink(row).getAttribute('href');
  expect(csvHref).toMatch(/\.csv\?file=[0-9a-f]{64}\.csv$/);
  const response = await request.get(csvHref!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-disposition']).toMatch(
    /^attachment;.*filename\*=UTF-8''[^']+\.csv$/,
  );

  // clear: an attribution value without a value can't be saved
  await openEditModal();
  await existing.getByRole('button', { name: 'Delete' }).click();
  // clearing a value with a note asks to remove the note as well
  await dialog
    .last()
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(attachmentLink(existing)).toHaveCount(0);
  await save(page);
  await expect(
    page.locator('.entity-modal-content__error-tooltip'),
  ).toContainText('Please enter a value or delete the attribution.');
});

test('editing an attribution in the form keeps its attachment', async ({
  page,
  seed,
}) => {
  const attribute = await seed.attribute({ dataType: 'ATTACHMENT' });
  const form = await seed.attributionForm([{ id: attribute.id }]);
  const cultivar = await seed.cultivar();

  await walkToForm(page, form.name, cultivar.display_name);
  await recordAttachment(page, attribute.name, {
    name: 'report.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.4\n% e2e ${seed.uid()}\n`),
  });

  // the toast's edit action reopens the attribution in the form, which
  // saves by deleting and re-inserting all values
  await page
    .locator('.q-notification')
    .getByRole('button', { name: 'Edit' })
    .click();
  const field = formField(page, attribute.name);
  const existingHref = await attachmentLink(field).getAttribute('href');
  expect(existingHref).toMatch(/\?file=[0-9a-f]{64}\.pdf$/);
  await page.locator('.attribute-form-save-btn .q-btn').click();
  await expect(page.locator('.q-notification').last()).toContainText(
    'Attribution saved.',
  );

  await page.goto(`/#/attributions?s=${encodeURIComponent(attribute.name)}`);
  const row = listRow(page, attribute.name);
  await expect(row).toHaveCount(1);
  await expect(attachmentLink(row)).toHaveAttribute('href', existingHref!);
});
