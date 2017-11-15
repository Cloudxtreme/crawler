const fs = require('fs');
const request = require('request-promise');
const Observable = require('rxjs/Observable').Observable;
const cheerio = require('cheerio');
require('rxjs/add/observable/interval');
require('rxjs/add/observable/from');
require('rxjs/add/observable/bindNodeCallback');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/map');
require('rxjs/add/operator/take');

const BASE_URL = `http://www.metacritic.com/browse/games/score/metascore/all/pc?sort=desc&page=`;
const SAVE_FILE_PATH = `./saved_files`;
const END_PAGE_NUM = 38;
const INTERVAL_TIME = 1000;

// Transform fs function to Observable.
const writeFile = Observable.bindNodeCallback(fs.writeFile);
const readFile = Observable.bindNodeCallback(fs.readFile);

// Un-comment function, if you want to these functions.
// crawlWholePage();
// parsePage();

// Get whole page of metacritic's pc game high score page.
function crawlWholePage() {
  let options = {
    method: 'GET',
    headers: { 'User-Agent': 'grapgrap' }
  };
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i => {
    options.uri = `${BASE_URL}${i}`;
    return Observable.from(request(options)).mergeMap(body => writeFile(`${SAVE_FILE_PATH}/${i}_file.txt`, body).map(() => i, (err) => console.log(err)));
  }).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} PAGE ======`),
    (i) => console.log(`====== ERROR PAGE ${i} ======`)
  )
}

// Parse page of crawlWholePage's result. We can get html about list of game.
function parsePage() {
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i =>
    readFile(`${SAVE_FILE_PATH}/${i}_file.txt`, 'utf-8')
      .map(body => cheerio.load(body))
      .map($ => $('.product_rows').html())
      .mergeMap(html =>
        writeFile(`${SAVE_FILE_PATH}/preprocessed/${i}_preprocessed_file.txt`, html).map(
          () => i,
          (err) => {
            console.err(err);
            return i;
          })
      )
  ).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} PAGE ======`),
    (i) => console.log(`====== ERROR PAGE ${i} ======`)
  );
}