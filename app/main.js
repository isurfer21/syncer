// @file main.js
$(function(e) {

    const TUNNEL_URL = "http://127.0.0.1:9999";

    function createSession() {
        console.log('createSession');
        $.ajax({
            crossDomain: true,
            url: TUNNEL_URL + '/session',
            method: 'GET',
            headers: {
                'cache-control': 'no-cache',
            },
            dataType: "jsonp",
            success: function(data) {
                if (data.status == 'failure') {
                    console.log(data.response);
                } else {
                    var response = JSON.parse(data.response);
                    console.log(response);
                    runCommand('ls', response.token);
                }
            },
            failure: function(xhr, status, error) {
                console.log('Command execution, Failed:', xhr, status, error);
            }
        });
    }

    function runCommand(command, token) {
        console.log('runCommand', command, token);
        $.ajax({
            crossDomain: true,
            url: TUNNEL_URL + "/terminal",
            method: "GET",
            headers: {
                'cache-control': 'no-cache',
            },
            dataType: "jsonp",
            data: {
                cmd: command,
                token: token
            },
            success: function(data) {
                if (data.status == "failure") {
                    console.log(data.response);
                } else {
                    var response = JSON.parse(data.response);
                    console.log(response);
                }
            },
            failure: function(xhr, status, error) {
                console.log('Command execution, Failed:', xhr, status, error);
            }
        });
    }

    createSession();
});