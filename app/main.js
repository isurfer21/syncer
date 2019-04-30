// @file main.js
$(function(e) {

    let tunnel = new Tunnel();

    let failure = (options, status, error) => {
        console.log('main.failure', status, error);
    };

    function createSession() {
        console.log('createSession');
        tunnel.session((token) => {
            console.log('main.session.success', token);
            runCommand('ls', token);
        }, failure);
    }

    function runCommand(command, token) {
        console.log('runCommand', command, token);
        tunnel.terminal(command, token,
            (result) => {
                console.log('main.terminal.success', result);
            }, failure
        );
    }

    createSession();
});