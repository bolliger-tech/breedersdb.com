import { expect, test } from './support/fixtures';
import { walkToForm } from './support/attribute-flow';
import { escapeRegExp, formField, listRow } from './support/locators';
import {
  addBaseFilterRule,
  addResultColumn,
  openAnalyzePage,
} from './support/analyze';

// ATTACHMENT values: uploaded on save, listed under "Attachments" on the
// entity view and linked under a generated name
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
    // the row in the "Attachments" list
    const item = dialog.locator('a.q-item').filter({ hasText: attribute.name });
    await expect(item).toHaveCount(1);
    await expect(item).toHaveAttribute('target', '_blank');
    await expect(item).toHaveAttribute('rel', 'noopener');
    const name = escapeRegExp(
      encodeURIComponent(
        downloadName(attribute.name, cultivar.display_name, 'DATE'),
      ),
    ).replace('DATE', '\\d{4}-\\d{2}-\\d{2}');
    const href = new RegExp(
      `^/api/assets/attachments/${name}\\.${ext}\\?file=[0-9a-f]{64}\\.${ext}$`,
    );
    await expect(item).toHaveAttribute('href', href);

    // the value cell of the attribute's table row links the same file
    const valueLink = dialog
      .locator('.entity-related-table tr')
      .filter({ hasText: attribute.name })
      .locator('a[href*="/api/assets/attachments/"]');
    await expect(valueLink).toHaveAttribute('href', href);

    const response = await request.get((await item.getAttribute('href'))!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toMatch(disposition);
  }
});

test('attachments larger than 10 MB are rejected before the upload', async ({
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
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  });
  await expect(field).toContainText('The file is larger than 10 MB.');
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
