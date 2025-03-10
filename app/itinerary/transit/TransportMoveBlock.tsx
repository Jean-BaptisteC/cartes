import Image from 'next/image'
import { transportTypeIcon } from './transportIcon'
import { isWhiteColor } from '@/components/css/utils'
import { findContrastedTextColor } from '@/components/utils/colors'
import { styled } from 'next-yak'

export default function TransportMoveBlock({ transport }) {
	const name = transport.shortName?.toUpperCase().replace(/TRAM\s?/g, 'T')
	const background = transport.route_color,
		color = transport.route_text_color
	const textColor =
		(color && (color !== background ? color : null)) ||
		findContrastedTextColor(background, true)
	return (
		<Wrapper $background={background} $textColor={textColor}>
			<Image
				src={transportTypeIcon(transport.route_type)}
				alt="Icône du type de transport : train, tram, bus, etc"
				width="100"
				height="100"
			/>
			{transport.icon ? (
				<Image
					src={transport.icon}
					alt={`Icône de l'entreprise de transport ${name}`}
					width="100"
					height="100"
				/>
			) : (
				<strong title={name}>{transport.frenchTrainType || name}</strong>
			)}
		</Wrapper>
	)
}

const Wrapper = styled.span`
	display: flex;
	align-items: center;
	background: ${(p) => p.$background || 'transparent'};
	width: fit-content;
	padding: 0 0.2rem;
	img {
		display: block;
		height: 0.8rem;
		width: auto;
		margin-right: 0.2rem;
		filter: brightness(0) invert(1);
	}
	img:first-child {
		filter: ${(p) =>
			p.$textColor && isWhiteColor(p.$textColor) ? `invert(1)` : ''};
	}
	strong {
		background: ${(p) => p.$background};
		color: ${(p) => p.$textColor};
		line-height: 1.2rem;
		border-radius: 0.4rem;
		white-space: nowrap;
	}
`
