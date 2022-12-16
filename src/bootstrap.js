window.HolochainClient = new Promise((f,r) => {
    import("./index.js")
	.then(m => {
	    f( m );
	}, r )
	.catch(e => console.error("Error importing `index.js`:", e));
});
