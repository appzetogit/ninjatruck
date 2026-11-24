import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ApiError } from '../../../../utils/ApiError.js';

/**
 * Driving licence photos. Kept outside Backend/uploads, which is served
 * publicly; admins read them through an authenticated endpoint. Re-encoding
 * proves the file is an image and drops EXIF (including GPS).
 */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../private/rental-licences');
const MAX_BYTES = 8 * 1024 * 1024;
const NAME = /^[a-f0-9]{32}\.jpg$/;

export const saveLicence = async (dataUrl) => {
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new ApiError(400, 'Add a photo of your driving licence');
  const input = Buffer.from(match[1], 'base64');
  if (input.length > MAX_BYTES) throw new ApiError(413, 'Licence photo must be under 8 MB');

  let image;
  try {
    image = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(1800, 1800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw new ApiError(400, 'That licence photo could not be read. Try another photo.');
  }

  const name = `${crypto.randomBytes(16).toString('hex')}.jpg`;
  await fs.mkdir(ROOT, { recursive: true, mode: 0o700 });
  await fs.writeFile(path.join(ROOT, name), image, { mode: 0o600 });
  return name;
};

export const readLicence = async (name) => {
  if (!NAME.test(name || '')) throw new ApiError(404, 'No licence photo');
  try {
    return await fs.readFile(path.join(ROOT, name));
  } catch {
    throw new ApiError(404, 'No licence photo');
  }
};

export const deleteLicence = async (name) => {
  if (NAME.test(name || '')) await fs.rm(path.join(ROOT, name), { force: true });
};
