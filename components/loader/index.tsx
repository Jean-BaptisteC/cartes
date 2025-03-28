import { styled } from 'next-yak'

export const Loader = ({ children, flexDirection = 'row' }) => (
	<Container $flexDirection={flexDirection}>
		<LoaderDiv className="loader" />
		{children}
	</Container>
)

const LoaderDiv = styled.div`
	color: var(--lightColor);
	width: 30px;
	aspect-ratio: 4;
	--_g: no-repeat
		radial-gradient(circle closest-side, var(--lightColor) 90%, #0000);
	background: var(--_g) 0% 50%, var(--_g) 50% 50%, var(--_g) 100% 50%;
	background-size: calc(100% / 3) 100%;
	animation: l7 1s infinite linear;
`

const Container = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.4rem;
	flex-direction: ${(p) => p.$flexDirection};

	@keyframes l7 {
		33% {
			background-size: calc(100% / 3) 0%, calc(100% / 3) 100%,
				calc(100% / 3) 100%;
		}
		50% {
			background-size: calc(100% / 3) 100%, calc(100% / 3) 0%,
				calc(100% / 3) 100%;
		}
		66% {
			background-size: calc(100% / 3) 100%, calc(100% / 3) 100%,
				calc(100% / 3) 0%;
		}
	}
`

export const ContentLoaderWrapper = styled.div`
	margin: 1rem 0;
	p {
		text-align: center;
		line-height: 1.3rem;
	}
`
