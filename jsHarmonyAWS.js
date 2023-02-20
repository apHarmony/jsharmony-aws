/*
Copyright 2022 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/

var _ = require('lodash');
var jsHarmonyModule = require('jsharmony/jsHarmonyModule');
var jsHarmonyAWSConfig = require('./jsHarmonyAWSConfig.js');
var AWS = require('aws-sdk');
var ejs = require('jsharmony/lib/ejs');
var async = require('async');

function jsHarmonyAWS(name, options){
  options = _.extend({
    schema: 'jsharmony'
  }, options);

  var _this = this;
  jsHarmonyModule.call(this, name);
  _this.Config = new jsHarmonyAWSConfig();

  if(name) _this.name = name;
  _this.typename = 'jsHarmonyAWS';

  _this.schema = options.schema;
}

jsHarmonyAWS.prototype = new jsHarmonyModule();

jsHarmonyAWS.prototype.sendTXTSMS = function(dbcontext, txt_attrib, sms_to, params, sms_options, callback){
  var _this = this;
  var jsh = this.jsh;
  //Load TXT data from database
  var dbtypes = jsh.AppSrv.DB.types;
  jsh.AppSrv.ExecRecordset(dbcontext, 'sms_send_txt', [dbtypes.VarChar(32)], { 'txt_attrib': txt_attrib }, function (err, rslt) {
    if ((rslt != null) && (rslt.length == 1) && (rslt[0].length == 1)) {
      var TXT = rslt[0][0];
      _this.sendBaseSMS(TXT[jsh.map.txt_body], sms_to, params, sms_options, callback);
    }
    else return callback(new Error('SMS ' + txt_attrib + ' not found.'));
  });
};

jsHarmonyAWS.prototype.sendBaseSMS = function(sms_body, sms_to, params, sms_options, callback){
  var _this = this;
  sms_to = sms_to || null;
  
  var mparams = {};
  if (sms_to) mparams.to = sms_to;
  mparams.text = sms_body;
  //Replace Params
  try {
    mparams.text = ejs.render(mparams.text, { data: params, _: _ });
  }
  catch (e) {
    return callback(e);
  }
  _this.sendSMS(mparams, sms_options, callback);
};

jsHarmonyAWS.prototype.sendSMS = function(mparams, sms_options, callback){
  var _this = this;
  if(!_this.Config || !_this.Config.credentials || !_this.Config.credentials.accessKeyId || !_this.Config.credentials.secretAccessKey) return callback(new Error('AWS credentials not defined in config'));
  if(!_this.Config || !_this.Config.region) return callback(new Error('AWS region not defined in config'));

  if(!mparams.to) return callback(new Error('SMS missing destination'));
  if(!_.isArray(mparams.to)) mparams.to = [mparams.to];
  var msg = (mparams.text||'').toString();

  async.eachSeries(mparams.to, function(toPhone, phone_cb){
    var snsClient = new AWS.SNS({
      accessKeyId: _this.Config.credentials.accessKeyId,
      secretAccessKey: _this.Config.credentials.secretAccessKey,
      region: _this.Config.region
    });
    snsClient.publish({
      PhoneNumber: toPhone,
      Message: msg
    }, function(err, data){
      if(err) return phone_cb(new Error('Error sending SMS to '+toPhone+': '+err.toString()));
      return phone_cb();
    });
  }, function(err){
    if(err) return callback(new Error('Error sending SMS: '+err.toString()));
    return callback();
  });
};

module.exports = exports = jsHarmonyAWS;