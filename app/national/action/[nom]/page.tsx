import data from '../../data.yaml'
import { utils } from 'publicodes'
const { decodeRuleName } = utils
import { MDXRemote } from 'next-mdx-remote/rsc'

const Page = ({ params }) => {
	const { nom: raw } = params

	const nom = decodeRuleName(raw)

	const rule = data.find((r) => r.titre === decodeURIComponent(nom))

	if (!rule) return <p>Cette action n'existe pas.</p>
	return (
		<main>
			<h1>{rule.titre}</h1>
			<MDXRemote source={rule.notes} />
		</main>
	)
}

export default Page