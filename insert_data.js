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

