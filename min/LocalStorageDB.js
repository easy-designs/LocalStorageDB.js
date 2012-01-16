if("localStorage" in window){function LocalStorageDB(B){this.version="0.4";var A,g=true,q=false,y=null,j,x=window,o="-",d="LocalStorageDB-",w="::tables::",f=JSON.stringify,m=JSON.parse,r={},a=0,i=function(){};i.prototype=Array.prototype;i.prototype.ORDER_BY=function(C){var e=this,D,F,E;if(C=="RANDOM"){e.sort(function(){return 0.5-Math.random()})}else{C=C.split(",");D=C.length;while(D--){C[D]=C[D].trim().split(" ");F=C[D][0];E=C[D][1];e.sort(function(H,G){var I=0;H=v(H);G=v(G);if(typeof H[F]=="string"){H=H[F].toLowerCase();G=G[F].toLowerCase();if(E=="ASC"){I=H<G?-1:(H>G?1:0)}else{I=H<G?1:(H>G?-1:0)}}if(typeof H[F]=="number"){I=E=="DESC"?G[F]-H[F]:H[F]-G[F]}return I})}}return e};i.prototype.LIMIT=function(C,e){if(!e){e=C;C=0}return this.splice(C,e)};try{j=x.localStorage}catch(u){if("console" in x){console.log("localStorage is not available",u)}return q}function s(){var C=t(w),e=C.length;if(e){r[w]=C}else{r[w]=[];k(w)}C=y}function b(D){if(w in r){var C=r[w],e=C.length;while(e--){if(D==C[e]){return g}}C=e=y}return q}function l(D,E){var F=r[D].dfn,C=r[D].index++,G={},e;for(e in F){if(F.hasOwnProperty(e)){G[e]=(e=="id")?C:(E[e]||F[e])}}r[D].data.push(G);a++;G=E=y}function n(D,H){D=h(D);var G=v(D.data),C=G.length,e=new i(),E,F;if(H instanceof Function){while(C--){E=H(G[C]);if(!!E){e.push(G[C])}}}else{if(H instanceof Object){rows:while(C--){E=G[C];for(F in H){if(H.hasOwnProperty(F)&&E[F]!=H[F]){continue rows}}e.push(E)}}else{if(!H){e=G.reverse()}}}D=G=H=y;return e.reverse()}function c(F,G,D){var e=F.length,C,E;rows:while(e--){C=F[e];for(E in G){if(G.hasOwnProperty(E)&&C[E]!=G[E]){continue rows}}D(e)}F=G=D=e=C=E=y}function h(e){return t(e)}function k(e){return z(e,r[e])}function v(e){return m(f(e))}function t(e){e=d+B+o+e;e=j.getItem(e);return !!e?m(e):[]}function z(C,D){C=d+B+o+C;try{j.setItem(C,f(D))}catch(E){if("console" in x){console.log("Storage quota was exceeded :-(",E)}}return true}function p(e){var e=e?d+B+o+e:d+B;j.removeItem(e);return true}this.AFFECTED_ROWS=function(){return a};this.SHOW_TABLES=function(){return r[w]};this.CREATE=function(C,e,D){if(!e||b(C)){throw new Error(C+" already exists");return q}r[C]={};r[C].data=[];r[C].dfn=e;r[C].index=1;r[w].push(C);k(w);if(D&&(D instanceof Array||D instanceof Object)){this.INSERT_INTO(C,D)}else{k(C)}e=D=y;return g};this.DESCRIBE=function(e){if(b(e)){return h(e).dfn}else{throw new Error(e+" is not a valid table name")}};this.TRUNCATE=function(e){a=0;if(!!e){if(b(e)){r[e]=h(e);a=r[e].data.length;r[e].index=0;r[e].data=[];k(e)}else{throw new Error(e+" is not a valid table name")}}else{throw new Error("truncate rquires a table name")}};this.DROP=function(D){if(!!D){if(b(D)){var C=r[w],e=C.length;while(e--){if(C[e]==D){r[w].splice(e,1);break}}k(w);p(D);C=y}else{throw new Error(D+" is not a valid table name")}}else{throw new Error("DROP rquires a table name")}};this.INSERT_INTO=function(D,E){a=0;if(b(D)){if(r[D]==A){r[D]=h(D)}if(E instanceof Array){for(var C=0,e=E.length;C<e;C++){if(E[C] instanceof Object){l(D,E[C])}}}else{if(E instanceof Object){l(D,E)}else{throw new Error("LocalStorageDB.insert() expects an Object or an array of Objects to be inserted as data")}}k(D);E=y}else{throw new Error(D+" is not a valid table name")}};this.SELECT=function(e,C){if(b(e)){return n(e,C)}else{throw new Error(e+" is not a valid table name")}};this.UPDATE=function(E,e,I){a=0;if(b(E)){r[E]=h(E);var C=r[E].data.length,D,F,G,H;if(e instanceof Function){while(C--){H=q;D=r[E].data[C];F=e(v(D));if(!!F){for(G in D){if(D.hasOwnProperty(G)&&D[G]!=F[G]){H=g;break}}if(H){r[E].data[C]=F;a++}}}}else{if(e instanceof Object){c(r[E].data,I,function(J){var K=r[E].data[J];for(G in r[E].dfn){if(r[E].dfn.hasOwnProperty(G)&&e.hasOwnProperty(G)){K[G]=e[G]}}r[E].data[J]=K;a++;J=K=y})}else{throw new Error("LocalStorageDB.UPDATE() expects a mutation object or function as the second argument")}}k(E);D=F=y}else{throw new Error(E+" is not a valid table name")}};this.DELETE=function(e,C){a=0;if(C==A){return this.truncate(e)}else{r[e]=h(e);c(r[e].data,C,function(D){r[e].data.splice(D,1);a++});k(e)}};s()}};