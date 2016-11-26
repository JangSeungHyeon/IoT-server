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
var temperature_value; //온도값//
var humidity_value; //습도값//
var get_temperature_value; //온도값 얻기//
var get_humidity_value; //습도값 얻기//

/** 집안의 private한 정보이기에 다 POST방식으로 한다. **/
//온도와 습도값을 저장하는 부분//
router.post('/temp_humi_insert', function(request, response){
    temperature_value = request.body.tempvalue; //전송할 메세지를 받는다.//
    humidity_value = request.body.humivalue;

    console.log('input temp/humi value: '+temperature_value+'/'+humidity_value);

    INSERT_func(temperature_value, humidity_value, response); //온도값을 저장//
});

//앱으로 부터 받는 리퀘스트 부분//
router.post('/get_temp_humi', function(request, response){
    console.log('get temperature / humidity');
    
    GET_temp_humi_value(response);
});
////////////////////////////
function GET_temp_humi_value(response) //검색 조회//
{
    //비동기 순차적으로 수행//
    async.waterfall([
        //Task 1 : 온도와 습도값을 가져온다.//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var temperature_value = -1;
            var humidity_value = -1;

            connection.query('select sensor_value from sensorservice where sensor_name = "temperature_sensor" or sensor_name = "humidity_sensor"', function(error, rows, fields){
                if(error) throw error;
                else{
                    for(var i=0; i<rows.length; i++)
                    {
                        console.log('value: '+rows[i].sensor_value);

                        if(i == 0) //온도센서의 경우//
                        {
                            temperature_value = rows[i].sensor_value;
                        }

                        else if(i==1) //습도센서의 경우//
                        {
                            humidity_value = rows[i].sensor_value;
                        }
                    }
                }

                callback(null, temperature_value, humidity_value);
            });

            connection.end();
        }
    ],
    //Final Task : 얻어온 온도와 습도값을 제공한다.//
    function(callback, temperature_value, humidity_value)
    {
        console.log('trans temp_value: '+temperature_value);
        console.log('trans humi_value: '+humidity_value);

        //전송 json객체를 만든다.//
        var result = 
        {
            'temp_data':temperature_value,
            'humi_data':humidity_value
        }

        var trans_objeect = 
        {
            'state':'normal',
            'info': result
        }

        var trans_json = JSON.stringify(trans_objeect); //json으로 반환//

        response.send(trans_json);
    });
}
////////////////////////////
function INSERT_func(temperature_value, humidity_value, response)
{
    //비동기 순차적으로 수행//
    async.waterfall([
        //Task 1 : 온도값을 저장//
        function(callback)
        {
            var connection = db_connection_pool(); //DB Connection pool//
            var is_success = false; //처음 실패라 가정//

            var update_data_array = [temperature_value]; //배열로 만든다.//

            connection.query('update sensorservice set sensor_value=? where sensor_name="temperature_sensor"',update_data_array, function(error, result){
                if(error) throw error;
                else{
                    console.log('update success...');

                    is_success = true; //성공이라 설정//

                    callback(null, is_success); //콜백함수의 인자에 맞추어서 매개변수를 설정//
                }
            });

            connection.end(); //데이터베이스 작업을 한 이후 반드시 닫아준다.//
        },
        //Task 2 : 습도값을 저장//
        function(is_success, callback)
        {
            if(is_success == false) //만약 온도데이터 저장이 실패했을 시 문제가 있으므로 습도는 저장하지 않는다.//
            {
                callback(null, is_success); //콜백함수의 인자에 맞추어서 매개변수를 설정//  
            }

            else
            {
                var connection = db_connection_pool(); //DB Connection pool//
                var is_success = false; //처음 실패라 가정//

                var update_data_array = [humidity_value]; //배열로 만든다.//

                connection.query('update sensorservice set sensor_value=? where sensor_name="humidity_sensor"',update_data_array, function(error, result){
                    if(error) throw error;
                    else{
                        console.log('update success...');

                        is_success = true; //성공이라 설정//
                    }

                    callback(null, is_success); //콜백함수의 인자에 맞추어서 매개변수를 설정//
                });

                connection.end(); //데이터베이스 작업을 한 이후 반드시 닫아준다.//
            }
        }
    ],
    //final Task : 아두이노로 JSON결과 반환//
    function(callback, is_success)
    {
        console.log('update success : ' + is_success);

        if(is_success == true) //데이터 저장 성공//
        {
            //전송 json객체를 만든다.//
            var result = 
            {
                'temp_data':temperature_value,
                'humi_data':humidity_value
            }

            var trans_objeect = 
            {
                'is_success':is_success,
                'info': result
            }
        }

        else if(is_success == false) //파일저장 실패//
        {
            //전송 json객체를 만든다.//
            var result = 
            {
                'temp_data':temperature_value,
                'humi_data':humidity_value
            }

            var trans_objeect = 
            {
                'is_success':is_success,
                'info': result
            }   
        }

        var trans_json = JSON.stringify(trans_objeect); //json으로 반환//

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