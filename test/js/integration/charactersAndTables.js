/* global describe, it, assert, serverData, h54s, getRandomAsciiChars, proclaim */
describe('h54s integration -', function() {
  describe('Characters and tables tests:', function() {

    before(function(done) {
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
      });
      sasAdapter.login(serverData.user, serverData.pass, function(status) {
        if(status === 200) {
          done();
        } else {
          done(new Error('Unable to login'));
        }
      })
    });

    it('Test json character escape', function(done) {
      this.timeout(10000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot
      });

      var data0 = "\\\"/\/\?''";
      var data1 = "asd\nasd\tasd\r\nasdasd" + String.fromCharCode(10) + "asd";

      var table = new h54s.Tables([
        {
          data0: data0,
          data1: data1
        }
      ], 'data');

      sasAdapter.call('BounceData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.isDefined(res, 'Response is undefined');
        assert.equal(res.outputdata[0].DATA0, data0, 'Bounce data is different - data0');
        assert.equal(res.outputdata[0].DATA1, data1, 'Bounce data is different - data1');
        done();
      });
    });

    it('Test ascii characters', function(done) {
      this.timeout(10000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        debug: true,
        metadataRoot: serverData.metadataRoot
      });

      var chars = {};
      for(var i = 32; i < 128; i++) {
        chars['data' + i] = String.fromCharCode(i);
      }

      var table = new h54s.Tables([chars], 'data');

      sasAdapter.call('BounceData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.isDefined(res, 'Response is undefined');
        for(var i = 32; i < 128; i++) {
          assert.equal(res.outputdata[0]['DATA' + i], chars['data' + i], chars['data' + i] + ' character is not the same in response');
        }
        done();
      });
    });

    it('Test big ascii string', function(done) {
      this.timeout(30000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot
      });
      var data = getRandomAsciiChars(10000);

      proclaim.throws(function() {
        new h54s.Tables([
          {
            data1: data,
            data2: data,
            data3: data,
            data4: data
          }
        ], 'data');
      }, 'Row 0 exceeds size limit of 32kb');

      proclaim.throws(function() {
        new h54s.Tables([
          {
            data1: data
          }, {
            data1: data,
            data2: data,
            data3: data,
            data4: data
          }
        ], 'data');
      }, 'Row 1 exceeds size limit of 32kb');

      proclaim.doesNotThrow(function() {
        var rows = [
          {
            data: 0 + ' ' + data
          }, {
            data: 1 + ' ' + data
          }, {
            data: 2 + ' ' + data
          }, {
            data: 3 + ' ' + data
          }, {
            data: 4 + ' ' + data
          }, {
            data: 5 + ' ' + data
          }, {
            data: 6 + ' ' + data
          }, {
            data: 7 + ' ' + data
          }, {
            data: 8 + ' ' + data
          }, {
            data: 9 + ' ' + data
          }, {
            data: 10 + ' ' + data
          }, {
            data: 11 + ' ' + data
          }
        ];

        var table = new h54s.Tables(rows, 'data');

        sasAdapter.call('BounceData', table, function(err, res) {
          assert.isUndefined(err, 'We got error on sas program ajax call');
          assert.isDefined(res, 'Response is undefined');
          assert.equal(res.outputdata.length, 12, 'Received less rows than sent');
          for(var i = 0; i < res.outputdata.length; i++) {
            assert.equal(res.outputdata[i].DATA, rows[i].data, 'Row ' + i + ' is not the same in response');
          }
          done();
        });
      });
    });

    it('Test big table', function(done) {
      this.timeout(30000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot
      });

      var str = getRandomAsciiChars(1000);
      var rows = [];

      //70kb
      for(var i = 0; i < 700; i++) {
        rows.push({
          data: i + str
        });
      }

      var table = new h54s.Tables(rows, 'data');

      sasAdapter.call('BounceData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.isDefined(res, 'Response is undefined');
        assert.equal(res.outputdata.length, 700, 'Received less rows than sent');
        done();
      });
    });

    it('Test call method with SasData table', function(done) {
      this.timeout(10000);

      var data = [
        {
          data: 'test'
        }
      ];

      var table = new h54s.SasData(data, 'data');

      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot
      });

      sasAdapter.call('bounceUploadData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.deepEqual(res.data, data, 'Bounce data is different');
        done();
      });
    });

    it('Test json character escape in SasData', function(done) {
      this.timeout(10000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot
      });

      var data = {
        str: "asd\nasd\tasd\r\nasdasd" + String.fromCharCode(10) + "asd",
        c0: '"',
        c1: '\\',
        c2: '/',
        c3: '\n',
        c4: '\t',
        c5: '\f',
        c6: '\r',
        c7: '\b'
      }

      var table = new h54s.SasData([
        data
      ], 'data');

      sasAdapter.call('bounceUploadData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.isDefined(res, 'Response is undefined');
        //TODO: res.data[0] should be changed to res.outputdata[0] to be consistent with other methods
        assert.equal(res.data[0].c0, data.c0, 'Bounce data is different - c0');
        assert.equal(res.data[0].c1, data.c1, 'Bounce data is different - c1');
        assert.equal(res.data[0].c2, data.c2, 'Bounce data is different - c2');
        assert.equal(res.data[0].c3, data.c3, 'Bounce data is different - c3');
        assert.equal(res.data[0].c4, data.c4, 'Bounce data is different - c4');
        assert.equal(res.data[0].c5, data.c5, 'Bounce data is different - c5');
        assert.equal(res.data[0].c6, data.c6, 'Bounce data is different - c6');
        assert.equal(res.data[0].c7, data.c7, 'Bounce data is different - c7');

        assert.equal(res.data[0].str, data.str, 'Bounce data is different - str');
        done();
      });
    });

    it('Test old type of data transmission with application/x-www-form-urlencoded', function(done) {
      this.timeout(6000);
      var table = new h54s.Tables([{
        test: 'test'
      }], 'data');

      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot,
        useMultipartFormData: false,
        debug: true
      });

      sasAdapter.call('BounceData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        assert.deepEqual(res.outputdata[0].TEST, 'test', 'Bounce data is different');
        done();
      });
    });

    it('Test UTF-8 characters', function(done) {
      this.timeout(10000);
      var sasAdapter = new h54s({
        hostUrl: serverData.url,
        metadataRoot: serverData.metadataRoot,
        debug: true
      });

      var data = {},
          key = 'c0',
          j = 0;
      data[key] = '';
      var skip = [0x0378, 0x0379, 0x0380, 0x0381, 0x0382, 0x0383, 0x038B, 0x038D, 0x03A2,
                  0x0530, 0x0557, 0x0558, 0x0560, 0x0588, 0x058B, 0x058C, 0x0590, 0x05C8,
                  0x05C9, 0x05CA, 0x05CB, 0x05CC, 0x05CD, 0x05CF, 0x05EB, 0x05EC, 0x05ED,
                  0x05EE, 0x05EF, 0x05F5, 0x05F6, 0x05F7, 0x05F8, 0x05F9, 0x05FA, 0x05FB,
                  0x05FC, 0x05FD, 0x05FE, 0x05FF, 0x061D, 0x070E, 0x074B, 0x074C, 0x07B2,
                  0x07B3, 0x07B4, 0x07B5, 0x07B6, 0x07B7, 0x07B8, 0x07B9, 0x07BA, 0x07BB,
                  0x07BC, 0x07BD, 0x07BE, 0x07BF, 0x07FB, 0x07FC, 0x07FD, 0x07FE, 0x07FF];

      // 30-2047 characters - 200 in each column
      // characters within 2 bytes
      // we are ignoring C0 and C1 control characters
      var i = 32;
      while(i <= 0x07FF) {
        if(skip.indexOf(i) !== -1) {
          i++;
          continue;
        }
        if(data[key].length === 200) {
          key = 'c' + ++j;
          data[key] = '';
        }
        data[key] += String.fromCharCode(i);
        i++;

        // jump over C1 characters
        if(i === 0x7F) {
          i = 0xC2;
        }
      }

      var table = new h54s.SasData([
        data
      ], 'data');

      sasAdapter.call('bounceUploadData', table, function(err, res) {
        assert.isUndefined(err, 'We got error on sas program ajax call');
        for(key in data) {
          assert.equal(res.data[0][key], data[key], 'Bounce upload data is different for key: ' + key);
        }
        done();
      });
    });

  });
});
