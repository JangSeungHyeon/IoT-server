var express = require('express');
var mysql = require('mysql'); //데이터베이스 연결 모듈//
var bodyParser = require('body-parser'); //POST방식//
var async = require('async'); //비동기 순차처리를 위한 모듈//

//라우터별로 분리하기 위해 express의 라우터 기능 사용//
var router = express.Router();

//POST설정//
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({     //to support URL-encoded bodies (url-encoded방식)//
    extended: true
}));

//입력변수//
var what_data_list; /* sensor : 센서리스트, actual : 모터기기, alarm_sensor : 알람센서 */

//리스트 데이터를 전달하는 라우터//
router.post('/get_data', function(request, response){
    console.log('get list_data');

    //조건값을 입력받는다.//
    what_data_list = request.body.condition;
    
    GET_listdata(response, what_data_list);
});
////////////////////////////
function GET_listdata(response, what_data_list)
{
    async.waterfall([
        //Task 1 : 데이터 셋팅//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var data_list = new Array();

            connection.query('select device_id,device_name, device_imageurl from data_list where device_category = ?',what_data_list, function(error, rows, fields){
                if(error) throw error;
                else{
                    for(var i=0; i<rows.length; i++)
                    {
                        console.log(rows[i].device_id + '/' + rows[i].device_name + '/' + rows[i].device_imageurl);

                        //데이터 형식에 맞게 객체를 지정//
                        var object = 
                        {
                            "device_id":rows[i].device_id,
                            "device_name":rows[i].device_name,
                            "device_imageurl":rows[i].device_imageurl
                        }

                        data_list.push(object);
                    }
                }

                callback(null, data_list);
            });
        }
    ],
    //Final Task : 배열의 값을 전송//
    function trans_data(callback, data_list)
    {
        console.log('trans data : '+data_list);

        //전송 json객체를 만든다.//
        var result = 
        {
            "results":data_list,
        }

        var trans_json = JSON.stringify(result); //json으로 반환//

        response.send(trans_json);
    });
}
////////////////////////////
function db_connection_pool()
{
    //데이터베이스 정보 설정//
    var connection = mysql.createConnection({
        host : 'localhost', //db ip address//
        port : 3306, //db port number//
        user : 'root', //db id//
        password : '3315', //db password//
        database : 'home' //db schema name//
    });

    //mysql connection//
    connection.connect(function(err){
        if(err){
            console.error('mysql connection error');
            console.error(err);
        }

        else{
            console.log('connection success...');
        }
    });

    return connection;
}
////////////////////////////
module.exports = router; //모듈 적용//