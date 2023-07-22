

export const INK_FACTOR = 0.0004;

function addDays( date:Date, days:number ):Date {
  const result = new Date( date );

  result.setDate( result.getDate() + days );

  return result;
}

function addMonths( date:Date, months:number ):Date {
  const result = new Date( date );

  result.setMonth( result.getMonth() + months );

  return result;
}

function addHours( date:Date, hours:number ):Date {
  const result = new Date( date );

  result.setHours( result.getHours() + hours );

  return result;
}

const releaseDate = new Date( "2022-06-17T12:00:00.000Z" );

export const PHASES = [
  {
    id   : "ink",
    name : "INK Sale",
    desc : "Public sale of INK tokens begins.",
    date : releaseDate,
    end  : addDays( releaseDate, 7 ),
  },
  {
    id   : "factory",
    name : "NiftyFactory",
    desc : "Characters can drawn and published, but will not be revealed.",
    date : addDays( releaseDate, 10 ),
    end  : addDays( releaseDate, 7 ),
  },
  {
    id   : "reveal",
    name : "Reveal",
    desc : "All characters that have been submitted will be revealed. All future characters will be revealed shortly after they are published.",
    date : addMonths( releaseDate, 1 ),
  },
];
export function getPhase( id:string ){
  return PHASES.find( p => p.id === id );
}
export const BRAND = "Decent-Factory";
export const NFTNAME = "Inkognitos";
