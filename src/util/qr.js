/* QR CODES — a join link as a square a phone camera can read (qrcode-generator, MIT). Pure: text in, SVG out. */
import qrcode from 'qrcode-generator';

// The QR for a link as an <svg> that fills its box (dark squares on white, with the quiet border cameras need).
export function qrSvg(text){
  if (!text) return '';
  const q = qrcode(0, 'M'); q.addData(String(text)); q.make();
  return q.createSvgTag({ cellSize:4, margin:16, scalable:true });
}
// A link on this computer only (the offline file) can't be opened by a phone, so it gets no QR.
export const scannable = url => /^https?:/.test(url || '') && !/^https?:\/\/(localhost|127\.)/.test(url);
