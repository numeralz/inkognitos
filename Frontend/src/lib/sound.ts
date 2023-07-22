// window.AudioContext = window.AudioContext || ( <any>window ).webkitAudioContext;

// var context: AudioContext;
// var volume = 0.00001;
// var seconds = 0.5;
// var tone = 800;

// const SOUNDS:Record<string, {
//   gen: Function,
//   buf: Float32Array,
//   channel: AudioBufferSourceNode | null,
// }> = {
//   sin : {
//     gen( s:number, tone:number ) {
//       var sampleFreq = context.sampleRate / tone;
//       return Math.sin( s / ( sampleFreq / ( Math.PI * 2 ) ) );
//     },
//     buf     : null,
//     channel : null,
//   },
//   click : {
//     gen( s:number, tone:number ) {
//       var sampleFreq = context.sampleRate / tone;
//       // return Math.sin( s / ( sampleFreq / ( Math.PI * 2 ) ) ) * Math.pow( 1, -5 );
//       return volume * 1 / Math.pow(
//         s,
//         -1.1
//       ) * Math.sin( s / ( sampleFreq / ( Math.PI * 2 ) ) ) ;
//       // return volume * Math.sin( s / ( sampleFreq / ( Math.PI * 2 ) ) );
//     },
//     buf     : null,
//     channel : null,
//   },
// };

// export function playSound( sound: keyof typeof SOUNDS ){
//   const s = SOUNDS[sound];

//   if( !context ) {
//     context = new AudioContext();
//   }
  
//   var samples = Math.ceil( context.sampleRate * seconds );

//   if( !s.buf ){
//     s.buf = new Float32Array( samples );

//     for ( var i = 0; i < samples; i++ ) {
//       s.buf[i] = s.gen(
//         i,
//         tone
//       ) * volume;
//     }
//   }

//   {
//     const buffer = context.createBuffer(
//       1,
//       s.buf.length,
//       context.sampleRate
//     );

//     buffer.copyToChannel(
//       s.buf,
//       0
//     );

//     const channel = context.createBufferSource();

//     channel.connect( context.destination );
//     channel.buffer = buffer;
//     SOUNDS[sound].channel = channel;
//     channel.onended = () => {
//       channel.stop();
//     };
//     channel.start( 0 );
//     s.channel = channel;
//   }
  
//   // SOUNDS[sound].channel.playbackRate.value = 1;
// }
// export function stopSound( sound: keyof typeof SOUNDS ){
//   // SOUNDS[sound].channel.stop( 0 );
//   // SOUNDS[sound].channel.playbackRate.value = 0;
// }