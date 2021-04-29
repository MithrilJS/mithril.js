import fragment from "./render/fragment.js"
import hyperscript from "./render/hyperscript.js"
import trust from "./render/trust.js"

hyperscript.trust = trust
hyperscript.fragment = fragment
export default hyperscript
