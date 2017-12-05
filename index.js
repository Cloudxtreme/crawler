const fs = require('fs');
const request = require('request-promise');
const Observable = require('rxjs/Observable').Observable;
const cheerio = require('cheerio');
const moment = require('moment');
require('rxjs/add/observable/interval');
require('rxjs/add/observable/from');
require('rxjs/add/observable/bindNodeCallback');
require('rxjs/add/operator/mergeMap');
require('rxjs/add/operator/map');
require('rxjs/add/operator/take');
require('rxjs/add/operator/do');
require('rxjs/add/operator/toArray');

const BASE_URL = `http://www.metacritic.com/browse/games/score/metascore/all/pc?sort=desc&page=`;
const SAVE_FILE_PATH = `./saved_files`;
const PREPROCESSED_FILE_PATH = `./saved_files/preprocessed`;
const END_PAGE_NUM = 38;
const INTERVAL_TIME = 1000;

// Transform fs function to Observable.
const writeFile = Observable.bindNodeCallback(fs.writeFile);
const readFile = Observable.bindNodeCallback(fs.readFile);
const appendFile = Observable.bindNodeCallback(fs.appendFile);

// Un-comment function, if you want to these functions.
// crawlWholePage();
// parsePage();
// getGameTitle();
// getGameUrl();
// getGameDetail();
// getUserGameRatePage();
// getCriticGameRatePage();

// Get whole page of metacritic's pc game high score page.
function crawlWholePage() {
  let options = { method: 'GET', headers: { 'User-Agent': 'grapgrap' } };
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i => {
    options.uri = `${BASE_URL}${i}`;
    return Observable.from(request(options))
      .mergeMap(body => writeFile(`${SAVE_FILE_PATH}/${i}_file.html`, body)
        .map(() => i, (err) => console.log(err)));
  }).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} PAGE ======`),
    (i) => console.log(`====== ERROR PAGE ${i} ======`),
    () => console.log('====== FINISHED. ======')
  )
}

// Parse page of crawlWholePage's result. We can get html about list of game.
function parsePage() {
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i =>
    readFile(`${SAVE_FILE_PATH}/${i}_file.html`, 'utf-8')
      .map(body => cheerio.load(body))
      .map($ => $('.product_rows').html())
      .mergeMap(html =>
        writeFile(`${SAVE_FILE_PATH}/preprocessed/${i}_preprocessed_file.html`, html)
          .map(
            () => i,
            (err) => {
              console.err(err);
              return i;
            }
          )
      )
  ).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} PAGE ======`),
    (i) => console.log(`====== ERROR PAGE ${i} ======`),
    () => console.log('====== FINISHED. ======')
  );
}

// get game title from preprocessed files.
function getGameTitle() {
  const now = moment().format('YYYY-MM-DD');
  let count = 0;
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i =>
    readFile(`${PREPROCESSED_FILE_PATH}/${i}_preprocessed_file.html`, 'utf-8')
      .map(body => cheerio.load(body))
      .mergeMap($ =>
        Observable.from($('.product_item.product_title > a').toArray()
          .map(el => $(el).text().trim() + '\r\n')
        )
      )
      .mergeMap(title =>
        appendFile(`${SAVE_FILE_PATH}/title/${now}_ver.txt`, title)
          .map(() => count++, (err) => console.err(err))
      )
  ).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} ITEM ======`),
    null,
    () => console.log('====== FINISHED. ======')
  )
}

// get url from preprocessed files;
function getGameUrl() {
  const now = moment().format('YYYY-MM-DD');
  let count = 0;
  Observable.interval(INTERVAL_TIME).take(END_PAGE_NUM).mergeMap(i =>
    readFile(`${PREPROCESSED_FILE_PATH}/${i}_preprocessed_file.html`, 'utf-8')
      .map(body => cheerio.load(body))
      .mergeMap($ =>
        Observable.from($('.product_item.product_title > a').toArray()
          .map(el => $(el).attr('href').split('/game/pc/')[1] + '\r\n')
        )
      )
      .mergeMap(title =>
        appendFile(`${SAVE_FILE_PATH}/url/${now}_ver.txt`, title)
          .map(() => count++, (err) => console.err(err))
      )
  ).subscribe(
    (i) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${i} ITEM ======`),
    null,
    () => console.log('====== FINISHED. ======')
  )
}

function getGameDetail() {
  const now = '2017-11-17';
  readFile(`${SAVE_FILE_PATH}/url/${now}_ver.txt`)
    .map(data => (data + '').split('\r\n'))
    .mergeMap(list => Observable.interval(INTERVAL_TIME).take(list.length - 2).map(i => list[i]))
    .mergeMap(url => {
      let options = {
        method: 'GET',
        uri: `http://www.metacritic.com/game/pc/${url}/details`,
        headers: { 'User-Agent': 'grapgrap' }
      };
      return Observable.from(request(options))
        .map(body => cheerio.load(body))
        .map($ => $('#main').html())
        .mergeMap(html => writeFile(`${SAVE_FILE_PATH}/game_detail/${url}_file.html`, html))
        .map(() => url, (err) => console.err(err))
    })
    .subscribe(
      (url) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${url} ITEM ======`),
      null,
      () => console.log('====== FINISHED. ======')
    );
}

// get user game rate from user rate pages.
function getUserGameRatePage() {
  // const now = moment().format('YYYY-MM-DD');
  const now = '2017-11-17';
  readFile(`${SAVE_FILE_PATH}/url/${now}_ver.txt`)
    .map(data => (data + '').split('\r\n'))
    .mergeMap(list => Observable.interval(INTERVAL_TIME).take(list.length - 1).map(i => list[i]))
    .mergeMap(url => {
      let options = {
        method: 'GET',
        uri: `http://www.metacritic.com/game/pc/${url}/user-reviews`,
        headers: { 'User-Agent': 'grapgrap' }
      };
      return Observable.from(request(options))
        .map(body => cheerio.load(body))
        .map($ => $('.reviews.user_reviews').html())
        .mergeMap(html => writeFile(`${SAVE_FILE_PATH}/preprocessed_user_review/${url}_file.html`, html))
        .map(() => url, (err) => console.err(err))
    })
    .subscribe(
      (url) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${url} ITEM ======`),
      null,
      () => console.log('====== FINISHED. ======')
    );
}

// get critic game rate from critic rate pages.
function getCriticGameRatePage() {
  // const now = moment().format('YYYY-MM-DD');
  const now = '2017-11-17';
  readFile(`${SAVE_FILE_PATH}/url/${now}_ver.txt`)
    .map(data => (data + '').split('\r\n'))
    .mergeMap(list => Observable.interval(INTERVAL_TIME).take(list.length - 1).map(i => list[i]))
    .mergeMap(url => {
      let options = {
        method: 'GET',
        uri: `http://www.metacritic.com/game/pc/${url}/critic-reviews`,
        headers: { 'User-Agent': 'grapgrap' }
      };
      return Observable.from(request(options))
        .map(body => cheerio.load(body))
        .map($ => $('.reviews.critic_reviews').html())
        .mergeMap(html => writeFile(`${SAVE_FILE_PATH}/preprocessed_critic_review/${url}_file.html`, html))
        .map(() => url, (err) => console.err(err))
    })
    .subscribe(
      (url) => console.log(`====== COMPLETE TO CRAWL AND SAVE ${url} ITEM ======`),
      null,
      () => console.log('====== FINISHED. ======')
    );
}