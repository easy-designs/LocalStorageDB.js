/*------------------------------------------------------------------------------
Function:      LocalStorageDB()
Author:        Aaron Gustafson (aaron at easy-designs dot net)
Creation Date: 2011-10-03
Version:       0.1
Homepage:      http://github.com/easy-designs/LocalStorageDB.js
License:       MIT License (see homepage)
------------------------------------------------------------------------------*/
;if ( 'localStorage' in window )
{
	/**
	 * LocalStorageDB()
	 * a simple cross-browser DB using localStorage
	 *
	 * @param str name - the name for your DB
	 * @return obj - a LocalStorageDB instance
	 *
	 */
	function LocalStorageDB( name )
	{
		this.version = '0.1';
		
		var
		UNDEFINED,
		WINDOW	= window,
		__cache	= WINDOW.localStorage,
		HYPHEN	= '-',
		PREFIX	= 'LocalStorageDB-',
		TABLES	= '::tables::',
		
		encode	= JSON.stringify,
		decode	= JSON.parse,
		
		db		= {};


		// Private Methods
		function load()
		{
			var
			tables	= readFromCache( TABLES ),
			t		= tables.length;
			if ( t )
			{
				// store for easier access
				db[TABLES] = tables;
				// loop and load
				while ( t-- )
				{
					db[ tables[t] ] = readFromCache( tables[t] );
				}
			}
			else
			{
				db[TABLES] = [];
				cache( TABLES );
			}
		}
		function tableExists( table )
		{
			if ( TABLES in db )
			{
				var
				tables	= db[TABLES],
				t		= tables.length;
				while ( t-- )
				{
					if ( table == tables[t] )
					{
						throw new Error( table + ' already exists in DB ' + name );
						return true;
					}
				}
			}
			return false;
		}
		function insert( table, data )
		{
			var
			t	= db[table],
			p	= t.proto,
			i	= t.index++,
			d	= {},
			k;
			for ( k in p )
			{
				if ( p.hasOwnProperty( k ) )
				{
					// ids get auto-assigned, otherwise use the supplied data or the prototype fallback
					d[k] = ( k == 'id' ) ? i : ( data[k] || p[k] );
				}
			}
			db[table].data.push( d );
		}
		function findMatches( d, c )
		{
			var
			i	= d.length,
			a	= [],
			r, p;
			rows: while ( i-- )
			{
				r = d[i];
				for ( p in c )
				{
					if ( c.hasOwnProperty( p ) &&
					 	 r[p] != c[p] )
					{
						continue rows;
					}
				}
				a.push( r );
			}
			return a.reverse();
		}
		function withMatches( d, c, f )
		{
			var
			i	= d.length,
			r, p;
			rows: while ( i-- )
			{
				r = d[i];
				for ( p in c )
				{
					if ( c.hasOwnProperty( p ) &&
					 	 r[p] != c[p] )
					{
						continue rows;
					}
				}
				// trigger the callback, supplying the index
				f( i );
			}
			return true;
		}
		function cache( table )
		{
			writeToCache( table, db[table] );
		}
		function argTest( required, provided, message )
		{
			if ( provided < required )
			{
				throw new Error( message );
			}
		}
		// storage
		function readFromCache( table )
		{
			table = PREFIX + name + HYPHEN + table;
			table = __cache.getItem( table );
			return !! table ? decode( table ) : [];
		}
		function writeToCache( table, data )
		{
			table = PREFIX + name + HYPHEN + table;
			__cache.setItem( table, encode( data ) );
			return true;
		}
		function removeFromCache( table )
		{
			var
			table = table ? PREFIX + name + HYPHEN + table : PREFIX + name;
			__cache.removeItem( table );
			return true;
		}

		/**
		* LocalStorageDB.truncate() -> boolean
		* Empties the DB
		*
		* Option 1: Empties the entire DB
		*   LocalStorageDB.truncate()
		*
		* Option 2: Empties a table
		*   LocalStorageDB.truncate( table )
		*   @param str table - the table you'd like to empty
		*/
		this.truncate = function()
		{
			var
			table	= false,
			args	= arguments;
			if ( args.length == 1 )
			{
				table = SUB + args[0];
			}
			return removeFromCache( table );
		};

		/**
		* LocalStorageDB.selectRows( table, criteria ) -> array
		* Selects rows from a given table based on the supplied criteria
		*
		* Option 1: Select the entire DB table
		*   LocalStorageDB.selectRows( table )
		*   @param str table - the table to read
		*
		* Option 2: Select based on criteria
		*   LocalStorageDB.selectRows( table, criteria )
		*   @param str table - the table to read
		*   @param obj criteria - the criteria to match
		*/
		this.selectRows = function( table, criteria )
		{
			return findMatches( db[table].data, criteria );
		};

		/**
		* LocalStorageDB.insertRows( table, data ) -> boolean
		* Adds data to the table
		*
		* Option 1: Add a row
		*   LocalStorageDB.insertRows( table, data )
		*   @param str table - the table to use
		*   @param obj data - the data object to insert
		*/
		this.insertRows = function( table, data )
		{
			if ( data instanceof Array )
			{
				for ( var i=0, len = data.length; i < len; i++ )
				{
					if ( data[i] instanceof Object ) 
					{
						insert( table, data[i] );
					}
				}
			}
			else if ( data instanceof Object )
			{
				insert( table, data );
			}
			else
			{
				throw new Error( 'LocalStorageDB.insert() expects an Object or an array of Objects to be inserted as data' );
			}
			cache( table );
			return true;
		};
		
		
		/**
		* LocalStorageDB.createTable( table, proto, data ) -> boolean
		* Creates a new table and (optionally) in serts data into it
		*
		* Option 1: Create a table
		*   LocalStorageDB.createTable( table, proto )
		*   @param str table - the table name
		*   @param obj proto - the data object to use as a prototype for all rows
		* 
		* Option 2: Create a table and prefill it with data
		*   LocalStorageDB.createTable( table, proto, data )
		*   @param str table - the table name
		*   @param obj proto - the data object to use as a prototype for all rows
		*   @param array data - the data you want to prefill the table with
		*/
		this.createTable = function( table, proto, data )
		{
			if ( ! proto ||
				 tableExists( table ) )
			{
				return false;
			}

			// set up the table
			db[table]		= {};
			db[table].data	= [];
			db[table].proto	= proto;
			db[table].index	= 0;

			// inser the data (if asked)
			if ( data &&
				 data instanceof Array )
			{
				console.log('inserting data');
				this.insert( table, data );
			}
			
			// cache the table
			cache( table );
			// cache the table index
			db[TABLES].push( table );
			cache( TABLES );
			return true;
		};

		/**
		* LocalStorageDB.deleteRows() -> boolean
		* Removes rows matching criteria from table
		*
		* Option 1: Remove all rows
		*   LocalStorageDB.deleteRows( table )
		*   @param str table - the table to delete all rows from
		*
		* Option 2: Remove select rows
		*   LocalStorageDB.deleteRows( table, criteria )
		*   @param str table - the table to delete rows from
		*   @param obj criteria - the criteria to match
		*/
		this.deleteRows  = function( table, criteria )
		{
			if ( criteria == UNDEFINED )
			{
				return this.truncate( table );
			}
			else
			{
				withMatches( db[table].data, criteria, function( i ){
					db[table].data.splice(i,1);
				});
				cache( table );
				return true;
			}
		};
		
		
		
		load();
	}
}


