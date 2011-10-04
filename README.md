# LocalStorageDB

Uses the browser’s localStorage API (available in IE8+ and every other browser) as the basis for a simple database.

## Info

Developed by Aaron Gustafson, http://easy-designs.net

## Usage

The API is still developing, but using LocalStorageDB is pretty simple:

1. Create a new instance of the LocalStorageDB object, supplying the name you wish to give the DB

>>> `var DB = new LocalStorageDB('my_database');`

2. If the DB exists already (from a previous session), you're good to go. Otherwise, see the API to do the usual CRUD operations.

## API

__`CREATE()` - creates a new table__
You can define your tables by supplying a name for the table and a object-based definition (type checking is coming…).

>>> `DB.CREATE( 'my_first_table', { id: 0, foo: bar, test: 'ing' } );`

If you want to load data in immediately, you can do that by supplying a single object (for one row) or an array of objects (for multiple rows) as the third (optional) argument.

>>> `DB.CREATE( 'my_first_table', {id:0,foo:bar,test:'ing'}, [{foo:'baz',test:'ed'},{foo:'bat',test:'er'}] );`

__`INSERT()` - adds data to a table__

>>> `DB.INSERT( 'my_first_table', [{foo:'baz',test:'ed'},{foo:'bat',test:'er'}] );`

_Note: Any table defined to have an `id` property will automatically assign a unique auto-incremented id to that property upon insertion. Also, any defaults set in the definition object will be used if the property is not defined on the inserted object._

__`SELECT()` - find data in a table__
You can select all data in a table by only supplying the table name to the method

>>> `DB.SELECT( 'my_first_table' );`

Or you can collect a subset of rows, using an object to define your search criteria (JOIN and complex criteria are coming).

>>> `DB.SELECT( 'my_first_table', {foo:'bar'} );`


## License

LocalStorageDB is licensed under the terms of the MIT License, see the included MIT-LICENSE file.