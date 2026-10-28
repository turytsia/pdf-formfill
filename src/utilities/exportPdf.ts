import fontkit from '@pdf-lib/fontkit';
import {
  LineCapStyle,
  PDFDocument,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import { MARK_STROKE_RATIO } from '../state/constants';
import {
  ItemKind,
  type Item,
  type MarkItem,
  type TextItem,
} from '../state/types';

const INK = rgb(0, 0, 0);

export async function exportFilledPdf(
  source: ArrayBuffer,
  items: Array<Item>,
  fontBytes: ArrayBuffer,
): Promise<Uint8Array> {
  const pdfDocument = await PDFDocument.load(source);
  pdfDocument.registerFontkit(fontkit);
  const font = await pdfDocument.embedFont(fontBytes, { subset: true });
  const pages = pdfDocument.getPages();

  for (const item of items) {
    const page = pages[item.pageIndex];
    if (!page) {
      continue;
    }

    if (item.kind === ItemKind.Text) {
      drawTextItem(page, item, font);
    } else {
      drawMarkItem(page, item);
    }
  }

  return pdfDocument.save();
}

function drawTextItem(page: PDFPage, item: TextItem, font: PDFFont): void {
  Array.from(item.text).forEach((character, index) => {
    if (character.trim() === '') {
      return;
    }

    const glyphWidth = font.widthOfTextAtSize(character, item.fontSize);

    page.drawText(character, {
      x: item.x + index * item.spacing + (item.spacing - glyphWidth) / 2,
      y: item.baseline,
      size: item.fontSize,
      font,
      color: INK,
    });
  });
}

function drawMarkItem(page: PDFPage, item: MarkItem): void {
  const half = item.size / 2;
  const stroke = {
    thickness: item.size * MARK_STROKE_RATIO,
    color: INK,
    lineCap: LineCapStyle.Round,
  };

  page.drawLine({
    start: { x: item.x - half, y: item.y - half },
    end: { x: item.x + half, y: item.y + half },
    ...stroke,
  });
  page.drawLine({
    start: { x: item.x - half, y: item.y + half },
    end: { x: item.x + half, y: item.y - half },
    ...stroke,
  });
}
