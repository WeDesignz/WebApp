"use client";

import { FC, useEffect, useState } from 'react';

// Export props interface
export interface ViewerProps {
	url: string;
	width?: number | string;
	height?: number | string;
	modelXOffset?: number;
	modelYOffset?: number;
	defaultRotationX?: number;
	defaultRotationY?: number;
	defaultZoom?: number;
	minZoomDistance?: number;
	maxZoomDistance?: number;
	enableMouseParallax?: boolean;
	enableManualRotation?: boolean;
	enableHoverRotation?: boolean;
	enableManualZoom?: boolean;
	ambientIntensity?: number;
	keyLightIntensity?: number;
	fillLightIntensity?: number;
	rimLightIntensity?: number;
	environmentPreset?: 'city' | 'sunset' | 'night' | 'dawn' | 'studio' | 'apartment' | 'forest' | 'park' | 'none';
	autoFrame?: boolean;
	placeholderSrc?: string;
	showScreenshotButton?: boolean;
	fadeIn?: boolean;
	autoRotate?: boolean;
	autoRotateSpeed?: number;
	onModelLoaded?: () => void;
}

// Safe wrapper that only loads ModelViewer when needed
const ModelViewerSafe: FC<ViewerProps> = (props) => {
	const [ModelViewerComponent, setModelViewerComponent] = useState<FC<ViewerProps> | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Only import ModelViewer when we're definitely on the client and React is ready
		if (typeof window === 'undefined' || typeof document === 'undefined') {
			return;
		}

		// Wait for React to be fully initialized
		// Use requestAnimationFrame to ensure DOM and React are ready
		let cancelled = false;

		const loadModelViewer = () => {
			if (cancelled) return;
			
			// Dynamically import ModelViewer which contains React Three Fiber
			import('./ModelViewer')
				.then((module) => {
					if (!cancelled) {
						setModelViewerComponent(() => module.default);
						setIsLoading(false);
					}
				})
				.catch((error) => {
					if (!cancelled) {
						// Silently handle the error - it's likely just a bundling warning
						console.warn('ModelViewer loading handled:', error.message);
						setIsLoading(false);
					}
				});
		};

		// Use requestAnimationFrame to ensure browser is ready
		if (typeof requestAnimationFrame !== 'undefined') {
			requestAnimationFrame(() => {
				if (!cancelled) {
					loadModelViewer();
				}
			});
		} else {
			// Fallback for environments without requestAnimationFrame
			setTimeout(loadModelViewer, 100);
		}

		return () => {
			cancelled = true;
		};
	}, []);

	if (isLoading || !ModelViewerComponent) {
		return (
			<div 
				style={{ 
					width: props.width || '100%', 
					height: props.height || '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center'
				}}
				className="relative"
			>
				<div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	return <ModelViewerComponent {...props} />;
};

export default ModelViewerSafe;

