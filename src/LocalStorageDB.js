/*------------------------------------------------------------------------------
Function:      LocalStorageDB()
Author:        Aaron Gustafson (aaron at easy-designs dot net)
Creation Date: 2011-10-03
Version:       0.4
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
		this.version = '0.4';
		
		var
		UNDEFINED,
		TRUE	= true,
		FALSE	= false,
		NULL	= null,
		__cache,
		WINDOW	= window,
		HYPHEN	= '-',
		PREFIX	= 'LocalStorageDB-',
		TABLES	= '::tables::',
		
		encode	= JSON.stringify,
		decode	= JSON.parse,
		
		// DB innards
		DB				= {},
		AFFECTED_ROWS	= 0,
		
		// The RESULT_SET object inherits from Array
		RESULT_SET = function(){};
		RESULT_SET.prototype = Array.prototype;
		RESULT_SET.prototype.ORDER_BY = function( order )
		{
			var
			arr	= this,
			l, key, sort;

			if ( order == 'RANDOM' )
			{
				arr.sort(function(){
					return 0.5 - Math.random();
				});
			}
			else
			{
				// convert order to an array
				order	= order.split(',');
				l		= order.length;
				// loop in reverse order (to keep the specificity correct)
				while ( l-- )
				{
					order[l]	= order[l].trim().split(' ');
					key			= order[l][0];
					sort		= order[l][1];
					arr.sort(function(a,b){
						var
						ret = 0;
						// work on copies
						a	= clone(a);
						b	= clone(b);
						if ( typeof a[key] == 'string' )
						{
							a = a[key].toLowerCase();
							b = b[key].toLowerCase();
							if ( sort == 'ASC' )
							{
								ret = a < b ? -1 : ( a > b ? 1 : 0 );
							}
							else
							{
								ret = a < b ? 1 : ( a > b ? -1 : 0 );
							}
						}
						if ( typeof a[key] == 'number' )
						{
							ret = sort=='DESC' ? b[key] - a[key] : a[key] - b[key];
						}
						return ret;
					});
				}
			}
			return arr;
		};
		RESULT_SET.prototype.LIMIT = function( start, end )
		{
			if ( ! end )
			{
				end		= start;
				start	= 0;
			}
			return this.splice( start, end );
		};
		RESULT_SET.prototype.toArray = function()
		{
			var arr = this;
			return Array.prototype.slice.call(arr);
		};
		
		
		// for Firefox when users manually disable localStorage
		try {
			__cache = WINDOW.localStorage;
		} catch (e) {
			if ( 'console' in WINDOW )
			{
				console.log('localStorage is not available',e);
			}
			// die
			return FALSE;
		}
		
		
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
			}
			else
			{
				DB[TABLES] = [];
				cache( TABLES );
			}
			// garbage collection
			tables = NULL;
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
						return TRUE;
					}
				}
				// garbage collection
				tables = t = NULL;
			}
			return FALSE;
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
			p	= DB[table].dfn,
			i	= DB[table].index++,
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
			// garbage collection
			d = data = NULL;
		}
		/**
		 * findMatches( t, c ) -> array
		 * Finds items within the table that match the supplied criteria
		 * 
		 * @param array t - the table
		 * @param mixed c - the criteria object to be matched or the criteria function
		 */
		function findMatches( t, c )
		{
			t	= load( t );
			var
			d	= clone( t.data ), // never let a select mutate a row
			i	= d.length,
			a	= new RESULT_SET(),
			r, p;
			if ( c instanceof Function )
			{
				while ( i-- )
				{
					r = c( d[i] );
					if ( !! r )
					{
						a.push( d[i] );
					}
				}
			}
			else if ( c instanceof Object )
			{
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
			}
			else if ( ! c )
			{
				a = d.reverse();
			}
			
			// garbage collection
			t = d = c = NULL;
			
			// return
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
			
			// garbage collection
			d = c = f = i = r = p = NULL;
		}
		/**
		 * load( table ) -> boolean
		 * Loads the supplied table name
		 */
		function load( table )
		{
			return readFromCache( table );
		}
		/**
		 * cache( table ) -> boolean
		 * Caches the supplied table name
		 */
		function cache( table )
		{
			return writeToCache( table, DB[table] );
		}
		/**
		 * clone( obj ) -> object
		 * Clones a given object
		 */
		function clone( obj )
		{
			return decode( encode( obj ) );
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
			try {
				 __cache.setItem( table, encode( data ) );
			} catch (e) {
				// Quota was exceeded
				if ( 'console' in WINDOW )
				{
					console.log('Storage quota was exceeded :-(',e);
				}
			}
			return true;
		}
		function removeFromCache( table )
		{
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
		 * LocalStorageDB.SHOW_TABLES() -> array
		 * Provides an array of table names
		 */
		this.SHOW_TABLES = function()
		{
			return DB[TABLES];
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
				return FALSE;
			}

			// set up the table
			DB[table]		= {};
			DB[table].data	= [];
			DB[table].dfn	= dfn;
			DB[table].index	= 1;

			// cache the table index
			DB[TABLES].push( table );
			cache( TABLES );

			// insert the data (if asked)
			if ( data &&
				 ( data instanceof Array ||
				   data instanceof Object ) )
			{
				this.INSERT_INTO( table, data );
				// caching and garbage collection handled elsewhere
			}
			else
			{
				// cache the table
				cache( table );
			}
			
			// garbage collection
			dfn = data = NULL;
			
			return TRUE;
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
				return load( table ).dfn;
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
					DB[table] = load( table );
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
					// garbage collection
					tables = NULL;
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
				if ( DB[table] == UNDEFINED )
				{
					DB[table] = load( table );
				}
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
				// garbage collection
				data = NULL;
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
		 * Option 2: Select based on criteria object
		 *   LocalStorageDB.SELECT( table, criteria )
		 *   @param str table - the table to read
		 *   @param obj criteria - the criteria to match
		 *
		 * Option 3: Select based on criteria function
		 *   LocalStorageDB.SELECT( table, criteria )
		 *   @param str table - the table to read
		 *   @param function criteria - the function to run against each row
		 */
		this.SELECT = function( table, criteria )
		{
			if ( tableExists( table ) )
			{
				return findMatches( table, criteria );
			}
			else
			{
				throw new Error( table + ' is not a valid table name' );
			}
		};
		
		
		/**
		 * LocalStorageDB.UPDATE( table, mutation, criteria ) -> undefined
		 * Updates data in the table
		 *
		 * Option 1: Update all rows
		 *   LocalStorageDB.UPDATE( table, mutation )
		 *   @param str table - the table to use
		 *   @param obj mutation - the data object to use for mutating the table
		 * 
		 * Option 2: Update select rows
		 *   LocalStorageDB.UPDATE( table, mutation, criteria )
		 *   @param str table - the table to use
		 *   @param obj mutation - the data object to use for mutating the table
		 *   @param obj criteria - the criteria to match
		 * 
		 * Option 3: Custom mutation
		 *   LocalStorageDB.UPDATE( table, mutation )
		 *   @param str table - the table to use
		 *   @param function mutation - a function for use in mutating the table
		 */
		this.UPDATE = function( table, mutation, criteria )
		{
			AFFECTED_ROWS = 0;
			if ( tableExists( table ) )
			{
				DB[table] = load( table );
				var i = DB[table].data.length,
				o_data, n_data, p, changed;
				
				if ( mutation instanceof Function )
				{
					while ( i-- )
					{
						changed	= FALSE;
						o_data	= DB[table].data[i];
						n_data	= mutation( clone( o_data ) ); // clone before mutating
						if ( !! n_data )
						{
							for ( p in o_data )
							{
								if ( o_data.hasOwnProperty( p ) &&
								 	 o_data[p] != n_data[p] )
								{
									changed = TRUE;
									break;
								}
							}
							if ( changed )
							{
								DB[table].data[i] = n_data;
								AFFECTED_ROWS++;
							}
						}
					}					
				}
				else if ( mutation instanceof Object )
				{
					withMatches( DB[table].data, criteria, function( i ){
						var newData = DB[table].data[i];
						for ( p in DB[table].dfn )
						{
							if ( DB[table].dfn.hasOwnProperty( p ) &&
								 mutation.hasOwnProperty( p ) )
							{
								newData[p] = mutation[p];
							}
						}
						DB[table].data[i] = newData;
						AFFECTED_ROWS++;
						// garbage collection
						i = newData = NULL;
					});
				}
				else
				{
					throw new Error( 'LocalStorageDB.UPDATE() expects a mutation object or function as the second argument' );
				}
				cache( table );
				// garbage collection
				o_data = n_data = NULL;
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
				DB[table] = load( table );
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