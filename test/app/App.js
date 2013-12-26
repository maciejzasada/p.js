var User = import$('model.User');

var App = class$('App', {type$: class$.PUBLIC}, {

    instance$: {

        public$: {

            user: null,

            App: function () {
                 console.log('this is an App!');

                this.user = new User();
            }

        }

    }

});