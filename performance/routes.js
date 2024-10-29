// This makes this reusable across both the standard benchmark test set and any local ports and
// throwaway benchmark scripts that may be created.

let routesJson = ""
let stringVarsJson = ""
let numVarsJson = ""
let templatesJson = ""

for (let i = 0; i < 16; i++) {
	for (let j = 0; j < 16; j++) {
		templatesJson += `,"/foo${i}/:id${i}/bar${j}/:sub${j}"`
		routesJson += `,"/foo${i}/${i}/bar${j}/${j}"`
		stringVarsJson += `,{"id${i}":"${i}","sub${j}":"${j}"}`
		numVarsJson += `,{"id${i}":${i},"sub${j}":${j}}`
	}
}

// Flatten everything, since they're usually flat strings in practice.
export const {routes, stringVars, numVars, templates} = JSON.parse(`{
"routes":[${routesJson.slice(1)}],
"templates":[${templatesJson.slice(1)}],
"stringVars":[${stringVarsJson.slice(1)}],
"numVars":[${numVarsJson.slice(1)}]
}`)
