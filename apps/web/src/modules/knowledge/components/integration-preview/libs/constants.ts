import { KnowledgeNodeType } from "@knowledgeprism/constants";

import { type ProposedSection } from "~/modules/knowledge/libs/types/types.js";

const DEFAULT_PAGE_INDEX = 0;
const DEFAULT_SECTION_INDEX = 1;

const DEFAULT_PROPOSED_STRUCTURE: ProposedSection[] = [
	{
		id: "page-hardware",
		pages: [
			{
				content: `Overview:
Next-generation ProMotion OLED panel with adaptive refresh rate calibration from 1Hz to 120Hz.

Specifications:
• Peak brightness: up to 2000 nits in outdoor ambient conditions
• Color accuracy: Delta E < 1 with full DCI-P3 wide color gamut coverage
• Power consumption: 15% reduction via LTPO backplane technology

Use cases:
Critical for real-time video preview inspection and color-critical asset validation.`,
				id: "sec-display",
				originalContent: `Overview:
Next-generation ProMotion OLED panel with adaptive refresh rate calibration from 1Hz to 120Hz.

Specifications:
• Peak brightness: up to 1800 nits in outdoor ambient conditions
• Color accuracy: Delta E < 2 with full DCI-P3 wide color gamut coverage

Use cases:
Critical for real-time video preview inspection and color-critical asset validation.`,
				originalTitle: "Display specifications",
				status: "modified",
				title: "Display specifications",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: `Overview:
Advanced triple-lens array with second-generation sensor-shift optical image stabilization and computational photography pipelines.

Specifications:
• Main wide: 48MP quad-pixel sensor with f/1.78 aperture and 100% Focus Pixels
• Ultra-wide: 12MP sensor with 120-degree field of view and macro focus support
• Telephoto: 12MP 5x optical zoom module with 3D sensor-shift stabilization

Use cases:
High-resolution photogrammetry, low-noise asset documentation, and automated visual QA inspection.

Integration notes:
Camera raw streams feed directly into the Neural Engine for real-time edge processing without thermal throttling.`,
				id: "sec-cameras",
				originalContent: `Overview:
Advanced triple-lens array with first-generation sensor-shift optical image stabilization and computational photography pipelines.

Specifications:
• Main wide: 48MP quad-pixel sensor with f/1.78 aperture
• Ultra-wide: 12MP sensor with 120-degree field of view
• Telephoto: 12MP 3x optical zoom module

Use cases:
High-resolution photogrammetry, low-noise asset documentation, and automated visual QA inspection.`,
				originalTitle: "Camera system",
				status: "modified",
				title: "Camera system",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: `Overview:
High-density stacked battery architecture paired with intelligent battery health management controllers.

Specifications:
• Capacity: 4422 mAh with smart degradation mitigation algorithms
• Fast charging: 50% charge in 30 minutes with 20W or higher power adapter

Use cases:
Extended all-day operation for high-throughput AI scanning workloads.`,
				id: "sec-battery",
				status: "created",
				title: "Battery & charging",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "modified",
		title: "Hardware specifications",
		type: KnowledgeNodeType.SECTION,
	},
	{
		id: "page-sensors",
		pages: [
			{
				content: `Overview:
The LiDAR scanner is a direct time-of-flight sensor that measures distance by emitting laser light and calculating the time for reflected photons to return. It operates at the near-infrared wavelength range and is invisible to the human eye.

Specifications:
• Range: up to 5 metres in both indoor and outdoor environments
• Scan resolution: photon-level sensitivity with single-photon avalanche diode (SPAD) array
• Frame rate: nano-second pulses at high repetition rate, generating depth maps at display refresh cadence

Use cases:
The scanner enables enhanced AR experiences with instant object occlusion, room-scale 3D scanning for measurement apps, and significantly faster autofocus in low-light photography.

Integration notes:
The LiDAR data feeds into both ARKit for scene geometry and the camera pipeline for focus assist. Third-party apps access depth data through the AVDepthData API. Point cloud output is available in USD format through the RealityKit framework.`,
				id: "sec-lidar",
				status: "created",
				title: "LiDAR scanner",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: `Overview:
Dual multi-channel ambient light sensors combined with optical time-of-flight proximity detection.

Specifications:
• Dynamic range: 0.1 lux to 100,000 lux with sub-millisecond response
• Calibration: automated ambient white-point evaluation at continuous 60Hz

Use cases:
Autonomous TrueTone display adaptation and biometric facial proximity lock.`,
				id: "sec-proximity",
				status: "created",
				title: "Proximity & ambient light",
				type: KnowledgeNodeType.PAGE,
			},
			{
				content: `Overview:
High-precision barometric pressure sensor integrated with a 6-axis MEMS gyroscope and accelerometer array.

Specifications:
• Operating range: 300 hPa to 1100 hPa with altitude resolution of 10 cm
• Gyroscope bandwidth: up to 1 kHz with ultra-low angular noise

Use cases:
Floor-level indoor localization, gesture tracking, and rapid orientation changes.`,
				id: "sec-barometer",
				status: "created",
				title: "Barometer & gyroscope",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "created",
		title: "Sensor technology",
		type: KnowledgeNodeType.SECTION,
	},
	{
		id: "page-qa",
		pages: [
			{
				content: `Overview:
Automated factory-level optical and sensor calibration procedures ensuring uniform telemetry across production units.

Specifications:
• Tolerance: angular misalignment under 0.05 degrees across thermal cycles
• Inspection duration: 12 seconds per device in sterile chamber

Use cases:
Guarantees hardware reliability before firmware flashing and field deployment.`,
				id: "sec-calibration",
				status: "created",
				title: "Sensor calibration QA",
				type: KnowledgeNodeType.PAGE,
			},
		],
		status: "created",
		title: "Quality & testing",
		type: KnowledgeNodeType.SECTION,
	},
];

export {
	DEFAULT_PAGE_INDEX,
	DEFAULT_PROPOSED_STRUCTURE,
	DEFAULT_SECTION_INDEX,
};
