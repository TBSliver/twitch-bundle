// Refactored from http://dmfrancisco.github.io/react-icons/
import React from "react";

interface PreparedIcon {
	size?: string | number;
	style?: object;
}

interface IconProps extends PreparedIcon {
	icon: React.SVGProps<SVGElement>;
}

export function Icon({icon, size = 24, style}: IconProps) {
	let styles = {
		fill: "currentColor",
		verticalAlign: "middle",
		width: size,
		height: size,
		...style
	};
	return (
		<svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" style={styles}>
			{icon}
		</svg>
	);
}

export function DownChevronIcon(props: PreparedIcon) {
	return <Icon {...props} icon={<DownChevronSvg/>}/>;
}

export function RefreshIcon(props: PreparedIcon) {
	return <Icon {...props} icon={<RefreshSvg/>}/>;
}

function DownChevronSvg() {
	return <g>
		<path d="M16.59 8.59l-4.59 4.58-4.59-4.58-1.41 1.41 6 6 6-6z"/>
	</g>;
}

function RefreshSvg() {
	return <g>
		<path
			d="M17.65 6.35c-1.45-1.45-3.44-2.35-5.65-2.35-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78l-3.22 3.22h7v-7l-2.35 2.35z"/>
	</g>;
}
