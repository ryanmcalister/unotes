const uNotes = require('./uNotes');


async function activate(context){
	const unotes = new uNotes.UNotes(context);
    await unotes.initialize();
}
exports.activate = activate;


