import categoryGroupColors from '@/app/categoryGroupColors.yaml'
import { capitalise0 } from '@/components/utils/utils'
import { css, styled } from 'next-yak'
import Image from 'next/image'
import Link from 'next/link'
import { exactThreshold } from './QuickFeatureSearch'
import { goldCladding } from './QuickFeatureSearchUI'
import { useEffect, useState } from 'react'
import useIcons from './effects/useIcons'

export default function MoreCategories({
	getNewSearchParamsLink,
	activeCategoryKeys,
	filteredMoreCategories,
	doFilter,
	annuaireMode = false,
}) {
	// build the liste of (visible) groups with their categories
	const groups = filteredMoreCategories.reduce((memo, next) => {
		return {
			...memo,
			[next.group]: [...(memo[next.group] || []), next],
		}
	}, {})

	const bulkImages = useIcons()
	// variable d'état pour stocker le groupe dont toutes les catégories sont affichées
	const [largeGroup, setLargeGroup] = useState(false)
	// et fonction pour le modifier
	function changeLargeGroup(group) {
		setLargeGroup(group == largeGroup ? false : group)
	}

	return (
		<Wrapper>
			<ol>
				{!annuaireMode &&
					!doFilter && ( //si pas de recherche en cours, on affiche ce message
						<p style={{ marginBottom: '.4rem' }}>
							Astuce : encore plus de catégories disponibles via la barre de
							recherche
						</p>
					)}
				{Object.entries(groups).map(([group, categories]) => {
					const groupColor = categoryGroupColors[group]
					const expandGroup = group == largeGroup
					// tri des catégories par ordre alphabétique
					categories.sort(compareCategoryName)
					return (
						<Group
							key={group}
							$groupColor={groupColor}
							$expandGroup={expandGroup}
							$doFilter={doFilter}
						>
							<header onClick={() => changeLargeGroup(group)}>
								<span></span>
								<h2>{group}</h2>
							</header>
							<div>
								<ul>
									{categories.map((category) => {
										const isActive = activeCategoryKeys.includes(category.key)
										const desktopDisplay =
											doFilter || isActive || (expandGroup && !category.hidden)
										const mobileDisplay =
											doFilter || isActive || !category.hidden
										return (
											<Category
												key={category.key}
												$active={isActive}
												$isExact={category.score < exactThreshold}
												$desktopDisplay={desktopDisplay}
												$mobileDisplay={mobileDisplay}
											>
												<Link href={getNewSearchParamsLink(category)}>
													<MapIcon
														category={category}
														bulkImages={bulkImages}
													/>{' '}
													{capitalise0(category.name)}
												</Link>
											</Category>
										)
									})}
								</ul>
								<HorizontalScrollExpandButton
									$doFilter={doFilter}
									onClick={() => changeLargeGroup(group)}
								>
									<Image
										src={'/icons/more.svg'}
										width="10"
										height="10"
										alt="Voir plus de groupes de recherche"
									/>
								</HorizontalScrollExpandButton>
							</div>
						</Group>
					)
				})}
			</ol>
		</Wrapper>
	)
}

const HorizontalScrollExpandButton = styled.button`
	z-index: 10;
	position: absolute;
	right: -0.2rem;
	top: 1.3rem;
	width: 1.4rem;
	height: 1.4rem;
	padding: 0;
	display: ${(p) => (p.$doFilter ? `none` : `flex`)};
	@media (hover: hover) {
		display: none;
	}
	align-items: center;
	justify-content: center;
	background: white;
	img {
		padding: 0;
		margin: 0;
		width: 0.8rem;
		height: auto;
		filter: invert(78%) sepia(40%) saturate(225%) hue-rotate(171deg)
			brightness(97%) contrast(99%);
	}
	border-radius: 1.6rem;
	border: 2px solid var(--lighterColor);
`

const Wrapper = styled.div`
	margin-bottom: 0.6rem;
	@media (hover: none) {
		margin-top: ${(p) => (p.$doFilter ? `0.6rem` : '0')};
	}
	p {
		font-size: 75%;
		margin: 0.4rem 0 0.1rem 0;
		line-height: initial;
		color: var(--darkerColor);
	}
	ol,
	ul {
		list-style-type: none;
	}
	ol {
		max-width: 100%;
	}
	ol > li > div {
		overflow-x: scroll;
		white-space: nowrap;
		scrollbar-width: none;
		width: 100%;
	}
	ul {
		display: flex;
		align-items: center;

		li {
			margin: 0.2rem 0.2rem;
			padding: 0rem 0.3rem;
			line-height: 1.5rem;
			border-radius: 0.2rem;
			background: white;
			border: 2px solid var(--lighterColor);
			white-space: nowrap;

			a {
				text-decoration: none;
				color: inherit;
				img {
					margin-right: 0.05rem;
				}
			}
		}
	}
	header {
		margin: 0.3rem 0 0.1rem 0;
		display: flex;
		align-items: center;
		line-height: 1.2rem;
		cursor: pointer;
		h2 {
			margin: 0;
			font-size: 75%;
			font-weight: 600;
			text-transform: uppercase;
			line-height: initial;
			color: var(--darkerColor);
		}
	}
`
const Group = styled.li`
	> header > span {
		display: block;
		@media (hover: none) {
			display: none;
		}
		width: 0.8rem;
		height: 0.8rem;
		background: ${(p) => p.$groupColor};
		border-radius: 1rem;
		margin-right: 0.3rem;
	}
	position: relative;
	div {
		&:after {
			@media (hover: hover) {
				display: none;
			}
			${(p) =>
				p.$expandGroup || p.$doFilter
					? css`
							display: none;
					  `
					: ''}
			content: '';
			position: absolute;
			z-index: 1;
			top: 0.8rem;
			right: 0;
			bottom: 0;
			pointer-events: none;
			background-image: linear-gradient(
				to right,
				rgba(255, 255, 255, 0),
				var(--lightestColor2) 60%,
				var(--lightestColor2) 70%
			);
			width: 15%;
		}

		> ul {
			@media (hover: hover) {
				margin-top: 0.2rem;
				margin-left: 0.3rem;
				padding-left: 0.4rem;
			}
			${(p) =>
				p.$expandGroup
					? css`
							padding-left: 0.4rem;
							border-left: 2px solid ${(p) => p.$groupColor};
					  `
					: ''}
			/* Touch devices can scroll horizontally, desktop devices (hover:hover) cannot */
			@media (hover: hover) {
				flex-wrap: wrap;
			}
			@media (hover: none) {
				flex-wrap: ${(p) => (p.$expandGroup ? `wrap` : `none`)};
			}
		}
	}
`

const Category = styled.li`
	${(p) => (p.$isExact ? goldCladding : '')}

	${(p) =>
		p.$active
			? css`
					background: var(--lighterColor) !important;
					border-color: var(--darkColor) !important;
			  `
			: ''}
	@media (hover: hover) {
		display: ${(p) => (p.$desktopDisplay ? `flex` : `none`)};
	}
	@media (hover: none) {
		display: ${(p) => (p.$mobileDisplay ? `flex` : `none`)};
	}
`
export const MapIcon = ({ category, bulkImages, marginRight = 0 }) => {
	if (!bulkImages) return
	const src = bulkImages[category['icon alias'] || category['icon']]

	const alt = 'Icône de la catégorie ' + category.name

	if (src)
		return (
			<MapIconImage
				src={src}
				alt={alt}
				width="10"
				height="10"
				style={{ marginRight }}
			/>
		)
}

const MapIconImage = styled(Image)`
	width: 1.1rem;
	height: 1.1rem;
	vertical-align: sub;
	margin-bottom: 0.05rem;
`

function compareCategoryName(a, b) {
	if (a.name.toLowerCase() < b.name.toLowerCase()) {
		return -1
	}
	if (a.name.toLowerCase() > b.name.toLowerCase()) {
		return 1
	}
	return 0
}
