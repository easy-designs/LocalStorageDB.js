# LocalStorageDB

Uses the browser’s localStorage API (available in IE8+ and every other browser) as the basis for a simple database.

## Info

Developed by Aaron Gustafson, http://easy-designs.net

## Usage

The API is still developing, but using LocalStorageDB is pretty simple:

1. Create a new instance of the LocalStorageDB object, supplying the name you wish to give the DB

	var DB = new LocalStorageDB('my_first_database');

2. If the DB exists already (from a previous session), you're good to go. Otherwise, see the API to do the usual CRUD operations.

## API

__`version` - the library version


__`CREATE()` - creates a new table__

You can define your tables by supplying a name for the table and a object-based definition (type checking is coming…).

	DB.CREATE( 'my_first_table', { id: 0, foo: 'bar', test: 'ing' } );

If you want to load data in immediately, you can do that by supplying a single object (for one row) or an array of objects (for multiple rows) as the optional third argument (see `INSERT_INTO()`).


__`INSERT_INTO()` - adds data to a table__

	DB.INSERT_INTO( 'my_first_table', [{test:'ed'},{foo:'bat'}] );

_Note: Any table defined to have an `id` property will automatically assign a unique auto-incremented id to that property upon insertion. Also, any defaults set in the definition object will be used if the property is not defined on the inserted object._


__`SELECT()` - find data in a table__

You can select all data in a table by only supplying the table name to the method

	DB.SELECT( 'my_first_table' ); [{id:0,foo:'bar',test:'ed'},{id:1,foo:'bat',test:'ing'}]

Or you can collect a subset of rows, using an object to define your search criteria.

	DB.SELECT( 'my_first_table', {foo:'bar'} ); // [{id:0,foo:'bar',test:'ed'}]

Or you can collect a subset of rows, using a function to collect rows (by returning `true`).

	DB.SELECT( 'my_first_table', function( row ){ return ( row.foo == 'bar' ); } ); // [{id:0,foo:'bar',test:'ed'}]

`SELECT()` returns a `RESULT_SET` object (which inherits from Array). `RESULT_SET` objects can be mutated by the methods `ORDER_BY()` and `LIMIT()`.

	DB.SELECT( 'my_first_table' ).LIMIT(1)[0]; // {id:0,foo:'bar',test:'ed'}
	DB.SELECT( 'my_first_table' ).ORDER_BY( 'foo DESC' ).LIMIT(1)[0]; // {id:1,foo:'bat',test:'ing'}


__`UPDATE()` - updates rows in a table__

	DB.SELECT( 'my_first_table', {foo:'bar'} ); // [{id:0,foo:'bar',test:'ed'}]
	DB.UPDATE( 'my_first_table', {test:'nada'}, {foo:'bar'} );
	DB.SELECT( 'my_first_table', {foo:'bar'} ); // [{id:0,foo:'bar',test:'nada'}]


__`DELETE()` - remove data from a table__

You can delete select rows from a table using (you guessed it) a criteria object. Currently, all criteria must be met for the row to be removed.

	DB.DELETE( 'my_first_table', {foo:'bar'} );
	DB.SELECT( 'my_first_table', {foo:'bar'} ); // []

Supplying only the table name is the same as calling `TRUNCATE()`


__`AFFECTED_ROWS()` - returns the number of rows affected by the last operation__

	DB.INSERT_INTO( 'my_first_table', {test:'ed'} );
	DB.AFFECTED_ROWS(); // 1


__`TRUNCATE()` - empty a table & reset its index, but retain its definition__

	DB.TRUNCATE( 'my_first_table' );
	DB.SELECT( 'my_first_table' ); // []


__`DESCRIBE()` - returns the definition for a table__

	DB.DESCRIBE( 'my_first_table' ); // { id: 0, foo: 'bar', test: 'ing' }


__`DROP()` - drop a table from the DB__

	DB.DROP( 'my_first_table' );
	DB.SELECT( 'my_first_table' ); // ERROR


## License

LocalStorageDB is licensed under the terms of the MIT License, see the included MIT-LICENSE file.