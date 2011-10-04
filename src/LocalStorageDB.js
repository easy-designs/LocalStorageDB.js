/*------------------------------------------------------------------------------
Function:      LocalStorageDB()
Author:        Aaron Gustafson (aaron at easy-designs dot net)
Creation Date: 2011-10-03
Version:       1.0
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

		var
		UNDEFINED,
		WINDOW	= window,
		__cache	= WINDOW.localStorage,
		HYPHEN	= '-',
		PREFIX	= 'LocalStorageDB-',
		TABLES	= '::tables::',
		
		encode	= JSON.stringify,
		decode	= JSON.parse,
		
		// DB innards
		DB				= {},
		AFFECTED_ROWS	= 0;


		/**
		 * init() -> undefined
		 * Initializes the DB and loads its contents in to memory
		 */
		function init()
		{
			var
			tables	= readFromCache( TABLES ),
			t		= tables.length;
			if ( t )
			{
				// store for easier access
				DB[TABLES] = tables;
				// loop and load
				while ( t-- )
				{
					DB[ tables[t] ] = readFromCache( tables[t] );
				}
			}
			else
			{
				DB[TABLES] = [];
				cache( TABLES );
			}
		}
		/**
		 * tableExists( table ) -> boolean
		 * Verifies the existence of a table
		 * 
		 * @param str table - the table
		 */
		function tableExists( table )
		{
			if ( TABLES in DB )
			{
				var
				tables	= DB[TABLES],
				t		= tables.length;
				while ( t-- )
				{
					if ( table == tables[t] )
					{
						return true;
					}
				}
			}
			return false;
		}
		/**
		 * insertData( table, data ) -> undefined
		 * Inserts data in to the table, ensuring it matches the definition
		 * 
		 * @param str table - the table
		 * @param object data - the object to be inserted
		 */
		function insertData( table, data )
		{
			var
			t	= DB[table],
			p	= t.dfn,
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
			DB[table].data.push( d );
			AFFECTED_ROWS++;
		}
		/**
		 * findMatches( d, c ) -> array
		 * Finds items within the data set that match the supplied criteria
		 * 
		 * @param array d - the data set
		 * @param object c - the criteria to be matched
		 */
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
		/**
		 * withMatches( d, c, f ) -> undefined
		 * Iterates data and performs a function based on items that match the supplied criteria
		 * 
		 * @param array d - the data set
		 * @param object c - the criteria to be matched
		 * @param function f - the callback to be executed
		 */
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
		}
		/**
		 * cache( table ) -> boolean
		 * Caches the supplied table name
		 */
		function cache( table )
		{
			return writeToCache( table, DB[table] );
		}
		
		
		// ------------------------
		// STORAGE MECHANICS
		// ------------------------
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
		 * LocalStorageDB.AFFECTED_ROWS() -> number
		 * The number of rows affected by the last operation
		 */
		this.AFFECTED_ROWS = function()
		{
			return AFFECTED_ROWS;
		};
		
		/**
		 * LocalStorageDB.CREATE( table, proto, data ) -> boolean
		 * Creates a new table and (optionally) in serts data into it
		 *
		 * Option 1: Create a table
		 *   LocalStorageDB.CREATE( table, proto )
		 *   @param str table - the table name
		 *   @param obj dfn - the data object to use as a definition for all rows
		 * 
		 * Option 2: Create a table and prefill it with data
		 *   LocalStorageDB.CREATE( table, proto, data )
		 *   @param str table - the table name
		 *   @param obj dfn - the data object to use as a definition for all rows
		 *   @param array data - the data you want to prefill the table with
		 */
		this.CREATE = function( table, dfn, data )
		{
			if ( ! dfn ||
				 tableExists( table ) )
			{
				throw new Error( table + ' already exists' );
				return false;
			}

			// set up the table
			DB[table]		= {};
			DB[table].data	= [];
			DB[table].dfn	= dfn;
			DB[table].index	= 0;

			// insert the data (if asked)
			if ( data &&
				 ( data instanceof Array ||
				   data instanceof Object ) )
			{
				this.INSERT_INTO( table, data );
			}
			
			// cache the table
			cache( table );
			// cache the table index
			DB[TABLES].push( table );
			cache( TABLES );
			return true;
		};

		/**
		 * LocalStorageDB.DESCRIBE( table ) -> object
		 * Returns the definition object
		 *
		 * @param str table - the table name
		 */
		this.DESCRIBE = function( table )
		{
			if ( tableExists( table ) )
			{
				return DB[table].dfn;
			}
			else
			{
				throw new Error( table + ' is not a valid table name' );
			}
		};

		/**
		 * LocalStorageDB.TRUNCATE() -> undefined
		 * Empties a table
		 *
		 * @param str table - the table you'd like to empty
		 */
		this.TRUNCATE = function( table )
		{
			AFFECTED_ROWS = 0;
			if ( !! table )
			{
				if ( tableExists( table ) )
				{
					AFFECTED_ROWS = DB[table].data.length;
					DB[table].index	= 0;
					DB[table].data	= [];
					cache( table );
				}
				else
				{
					throw new Error( table + ' is not a valid table name' );
				}
			}
			else
			{
				throw new Error( 'truncate rquires a table name' );
			}
		};

		/**
		 * LocalStorageDB.DROP( table ) -> undefined
		 * Drops a table form the DB
		 *
		 * @param str table - the table you'd like to drop
		 */
		this.DROP = function( table )
		{
			if ( !! table )
			{
				if ( tableExists( table ) )
				{
					var
					tables	= DB[TABLES],
					i		= tables.length;
					while ( i-- )
					{
						if ( tables[i] == table )
						{
							DB[TABLES].splice(i,1);
							break;
						}
					}
					cache( TABLES );
					removeFromCache( table );
				}
				else
				{
					throw new Error( table + ' is not a valid table name' );
				}
			}
			else
			{
				throw new Error( 'DROP rquires a table name' );
				
			}
		};

		/**
		 * LocalStorageDB.INSERT( table, data ) -> undefined
		 * Adds data to the table
		 *
		 * Option 1: Add a row
		 *   LocalStorageDB.INSERT( table, data )
		 *   @param str table - the table to use
		 *   @param obj data - the data object to insert
		 * 
		 * Option 2: Add rows
		 *   LocalStorageDB.INSERT( table, data )
		 *   @param str table - the table to use
		 *   @param array data - an array of data objects to insert

		 */
		this.INSERT_INTO = function( table, data )
		{
			AFFECTED_ROWS = 0;
			if ( tableExists( table ) )
			{
				if ( data instanceof Array )
				{
					for ( var i=0, len = data.length; i < len; i++ )
					{
						if ( data[i] instanceof Object ) 
						{
							insertData( table, data[i] );
						}
					}
				}
				else if ( data instanceof Object )
				{
					insertData( table, data );
				}
				else
				{
					throw new Error( 'LocalStorageDB.insert() expects an Object or an array of Objects to be inserted as data' );
				}
				cache( table );
			}	
			else
			{
				throw new Error( table + ' is not a valid table name' );
			}
		};

	 	/**
		 * LocalStorageDB.SELECT( table, criteria ) -> array
		 * Selects rows from a given table based on the supplied criteria
		 *
		 * Option 1: Select the entire DB table
		 *   LocalStorageDB.SELECT( table )
		 *   @param str table - the table to read
		 *
		 * Option 2: Select based on criteria
		 *   LocalStorageDB.SELECT( table, criteria )
		 *   @param str table - the table to read
		 *   @param obj criteria - the criteria to match
		 */
		this.SELECT = function( table, criteria )
		{
			if ( tableExists( table ) )
			{
				return findMatches( DB[table].data, criteria );
			}
			else
			{
				throw new Error( table + ' is not a valid table name' );
			}
		};

		/**
		 * LocalStorageDB.UPDATE( table, data, criteria ) -> undefined
		 * Updates data in the table
		 *
		 * Option 1: Update all rows
		 *   LocalStorageDB.UPDATE( table, data )
		 *   @param str table - the table to use
		 *   @param obj data - the data object to use for updating the table
		 * 
		 * Option 2: Update select rows
		 *   LocalStorageDB.UPDATE( table, data, criteria )
		 *   @param str table - the table to use
		 *   @param obj data - the data object to use for updating the table
		 *   @param obj criteria - the criteria to match
		 */
		this.UPDATE = function( table, data, criteria )
		{
			AFFECTED_ROWS = 0;
			if ( tableExists( table ) )
			{
				if ( data instanceof Object )
				{
					withMatches( DB[table].data, criteria, function( i ){
						var 
						newData = DB[table].data[i],
						p;
						for ( p in data )
						{
							if ( data.hasOwnProperty( p ) )
							{
								newData[p] = data[p];
							}
						}
						DB[table].data[i] = newData;
						AFFECTED_ROWS++;
					});
				}
				else
				{
					throw new Error( 'LocalStorageDB.insert() expects an Object or an array of Objects to be inserted as data' );
				}
				cache( table );
			}
			else
			{
				throw new Error( table + ' is not a valid table name' );
			}
		};

		/**
		 * LocalStorageDB.DELETE() -> undefined
		 * Removes rows matching criteria from table
		 *
		 * Option 1: Remove all rows
		 *   LocalStorageDB.DELETE( table )
		 *   @param str table - the table to delete all rows from
		 *
		 * Option 2: Remove select rows
		 *   LocalStorageDB.DELETE( table, criteria )
		 *   @param str table - the table to delete rows from
		 *   @param obj criteria - the criteria to match
		 */
		this.DELETE  = function( table, criteria )
		{
			AFFECTED_ROWS = 0;
			if ( criteria == UNDEFINED )
			{
				return this.truncate( table );
			}
			else
			{
				withMatches( DB[table].data, criteria, function( i ){
					DB[table].data.splice(i,1);
					AFFECTED_ROWS++;
				});
				cache( table );
			}
		};
		
		
		
		// load it up!
		init();
	}
}


