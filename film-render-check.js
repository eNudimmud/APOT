'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const root = __dirname;
const out = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'apot-film-check-'));
const film = require(root + '/lib/signal-film');
const signal = require(root + '/signature-engine');
const studio = require(root + '/studio-engine');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
async function run() {
  const rows = [];
  for (const [id, username, tone] of [[signal.FIXTURE_X_ID, 'APOTsignal', 'midnight'], ['123456789', 'other_signal', 'paper']]) {
    const begin = Date.now(), result = await film.render({ id, username }, tone);
    const file = path.join(out, tone + '.mp4'); fs.writeFileSync(file, result.bytes);
    const metadata = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]));
    const video = metadata.streams.find(x => x.codec_type === 'video');
    const audio = metadata.streams.find(x => x.codec_type === 'audio');
    assert.equal(video.codec_name, 'h264'); assert.equal(video.profile, 'High'); assert.equal(video.pix_fmt, 'yuv420p');
    assert.equal(video.width, 1920); assert.equal(video.height, 1080); assert.equal(video.r_frame_rate, '30/1');
    assert.equal(Number(video.nb_frames), 150); assert.equal(audio.codec_name, 'aac'); assert.equal(audio.profile, 'LC');
    assert.equal(Number(audio.sample_rate), 44100); assert.equal(audio.channels, 1); assert.equal(Number(metadata.format.duration), 5);
    const decoded = execFileSync('ffmpeg', ['-v','error','-i',file,'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','pipe:1']);
    const values = new Float32Array(decoded.buffer, decoded.byteOffset, decoded.length / 4);
    const expected = studio.samples(signal.derive(signal.seedForIdentity(id)));
    let cross = 0, aa = 0, bb = 0;
    for (let i=0; i<Math.min(values.length,expected.length); i++) { cross+=values[i]*expected[i]; aa+=values[i]**2; bb+=expected[i]**2; }
    const correlation = cross / Math.sqrt(aa*bb);
    assert.ok(correlation > .98, 'AAC must contain this account\'s exact motif, allowing lossy encoding.');
    execFileSync('ffmpeg', ['-v','error','-ss','1.5','-i',file,'-frames:v','1','-vf','scale=960:540','-y',path.join(out,tone+'-review.png')]);
    const canvas=createCanvas(960,540), ctx=canvas.getContext('2d');
    const sig=signal.derive(signal.seedForIdentity(id));
    studio.paintFilm(ctx,sig,960,540,tone,0,username); const first=canvas.toBuffer('image/png');
    studio.paintFilm(ctx,sig,960,540,tone,1.5,username); const middle=canvas.toBuffer('image/png');
    assert.notDeepEqual(first,middle,'The signal must actually animate.');
    studio.paintFilm(ctx,sig,960,540,tone,1.5,username); assert.deepEqual(middle,canvas.toBuffer('image/png'),'A fixed account and timestamp must reproduce the same frame.');
    rows.push({id,seed:result.seed,tone,width:video.width,height:video.height,frames:video.nb_frames,fps:video.r_frame_rate,duration:metadata.format.duration,bytes:result.bytes.length,audioCorrelation:correlation,milliseconds:Date.now()-begin});
  }
  assert.notEqual(rows[0].seed, rows[1].seed);
  fs.writeFileSync(path.join(out,'render-results.json'),JSON.stringify(rows,null,2)); console.log(JSON.stringify(rows));
}
run().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>fs.rmSync(out,{recursive:true,force:true}));
