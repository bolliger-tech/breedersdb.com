import { computed, ref } from 'vue';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import { hashFile, useFileUploader } from 'src/composables/useFileUploader';

type FileFields = {
  text_value?: string | null | undefined;
  file_value?: File | string | null | undefined;
  photo_note?: File | string | null | undefined;
};

type WithFileNames<T extends FileFields> = Omit<
  T,
  'file_value' | 'photo_note'
> & {
  text_value: string | null;
  photo_note: string | null;
};

export function useAttributionFileUpload() {
  const percentComplete = ref(0);
  const isUploading = computed(
    () => percentComplete.value > 0 && percentComplete.value < 100,
  );

  const bytes = { total: 0, completed: 0 };
  const { upload } = useFileUploader((progress) => {
    percentComplete.value =
      (100 * (bytes.completed + progress.bytesUploaded)) / bytes.total;
  });

  /**
   * Uploads the new photos and attachments and returns the values with the
   * stored file names. The file_value of photos and attachments is stored in
   * text_value. Throws if an upload fails.
   */
  async function uploadFiles<T extends FileFields>(
    values: { value: T; dataType: AttributeFragment['data_type'] }[],
  ): Promise<WithFileNames<T>[]> {
    const uploads = values.flatMap(({ value, dataType }) => [
      ...(value.file_value instanceof File
        ? [
            {
              file: value.file_value,
              kind: dataType === 'PHOTO' ? 'images' : 'attachments',
            },
          ]
        : []),
      ...(value.photo_note instanceof File
        ? [{ file: value.photo_note, kind: 'images' }]
        : []),
    ]);

    percentComplete.value = 0;
    bytes.total = uploads.reduce((acc, { file }) => acc + file.size, 0);
    bytes.completed = 0;

    const fileNames = new Map<File, string>();
    for (const { file, kind } of uploads) {
      const { fileName } = await upload(
        file,
        await hashFile(file),
        `/api/assets/upload/${kind}`,
      );
      fileNames.set(file, fileName);
      bytes.completed += file.size;
    }

    const toFileName = (file: File | string | null | undefined) =>
      file instanceof File ? fileNames.get(file)! : (file ?? null);

    return values.map(({ value }) => {
      const { file_value, photo_note, ...rest } = value;
      return {
        ...rest,
        text_value: toFileName(file_value) ?? rest.text_value ?? null,
        photo_note: toFileName(photo_note),
      };
    });
  }

  return { uploadFiles, percentComplete, isUploading };
}
