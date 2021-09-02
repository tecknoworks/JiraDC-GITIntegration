const mongoose = require('mongoose')

const model = mongoose.Schema({
    project_id: {
        type: String,
        required: true
    },
    git_url: {
        type: String,
        required: true
    },
    workitem_id:{
        type: [String],
        required: false
    },
});

module.exports = new mongoose.model("GitProject", model)