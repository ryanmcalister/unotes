const uNotes = require('./uNotes');


function activate(context){
	new uNotes.UNotes(context);
}
exports.activate = activate;


