/**
 * Duotone — the opt-in second layer ADR-014 left open, decided in ADR-036 (Anuj, 2026-09-29).
 * Every outline icon has a twin here, in the same order as its category file.
 * How one is built, and the tint token: ./duotone-kit.ts.
 */
import { body, closed, duotone, holed, ring, tint, untinted } from './duotone-kit';
import {
  IconBell,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconFile,
  IconInfoCircle,
  IconSearch,
  IconSettings,
  IconTrash,
  IconUpload,
  IconUser,
  IconX,
} from './core';
import {
  IconChevronDown,
  IconChevronLeft,
  IconArrowRight,
  IconArrowLeft,
  IconArrowUp,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconArrowDownRight,
  IconArrowNarrowRight,
  IconArrowsSort,
  IconArrowsExchange,
  IconSelector,
  IconExternalLink,
  IconDownload,
  IconLogout,
  IconRefresh,
  IconRotate,
  IconPlus,
  IconDots,
  IconDotsVertical,
  IconMenu2,
  IconFilter,
  IconAdjustmentsHorizontal,
  IconCopy,
  IconPencil,
  IconLink,
  IconShare,
  IconSend,
} from './navigation';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconArchive,
  IconAt,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconExclamationMark,
  IconEye,
  IconEyeOff,
  IconHelpCircle,
  IconHome,
  IconInbox,
  IconInfoSmall,
  IconKey,
  IconLock,
  IconMail,
  IconMoon,
  IconPin,
  IconShieldCheck,
  IconSparkles,
  IconStar,
  IconSun,
  IconTrendingDown,
  IconTrendingUp,
  IconUserPlus,
  IconUsers,
  IconWorld,
} from './status';
import {
  IconBaselineDensityMedium,
  IconBaselineDensitySmall,
  IconBuildingBank,
  IconCode,
  IconComponents,
  IconCreditCard,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconFileCode,
  IconFileText,
  IconFileTypeCss,
  IconFileTypeTsx,
  IconFolder,
  IconGitBranch,
  IconJson,
  IconLayoutDashboard,
  IconLayoutGrid,
  IconLayoutList,
  IconLayoutRows,
  IconLayoutSidebar,
  IconReceipt,
  IconSquareSmall,
  IconTable,
  IconTerminal2,
  IconTextDirectionLtr,
  IconTextDirectionRtl,
  IconToggle,
  IconWallet,
} from './objects';
import {
  IconAccessible,
  IconAmbulance,
  IconApple,
  IconBaby,
  IconBandage,
  IconBed,
  IconBrain,
  IconCapsule,
  IconDna,
  IconDumbbell,
  IconFaceMask,
  IconFirstAidKit,
  IconGlasses,
  IconHeart,
  IconHeartPulse,
  IconHospital,
  IconLungs,
  IconMicroscope,
  IconPill,
  IconPrescription,
  IconStethoscope,
  IconSyringe,
  IconTestTube,
  IconThermometer,
  IconTooth,
  IconVirus,
  IconWalk,
  IconWheelchair,
} from './health';
import {
  IconBarcode,
  IconBuildingStore,
  IconCalculator,
  IconCash,
  IconChartBar,
  IconChartLine,
  IconChartPie,
  IconCoin,
  IconCoins,
  IconCurrencyDollar,
  IconCurrencyEuro,
  IconCurrencyRupee,
  IconDiscount,
  IconFileInvoice,
  IconGift,
  IconHandCoin,
  IconPackage,
  IconPercentage,
  IconPiggyBank,
  IconQrcode,
  IconReceiptRefund,
  IconSafe,
  IconScale,
  IconShoppingBag,
  IconShoppingCart,
  IconTag,
  IconTrophy,
  IconTruck,
} from './commerce';
import {
  IconBellOff,
  IconBook,
  IconBookmark,
  IconBroadcast,
  IconCamera,
  IconFlag,
  IconHeadphones,
  IconMessage,
  IconMessageDots,
  IconMicrophone,
  IconMicrophoneOff,
  IconMoodSmile,
  IconMovie,
  IconMusic,
  IconNews,
  IconPaperclip,
  IconPhone,
  IconPhoneCall,
  IconPhoto,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipForward,
  IconPlayerStop,
  IconRss,
  IconThumbUp,
  IconVideo,
  IconVolume,
  IconVolumeOff,
} from './media';
import {
  IconAnchor,
  IconBike,
  IconBolt,
  IconBriefcase,
  IconBuilding,
  IconBuildings,
  IconBus,
  IconCalendarEvent,
  IconCar,
  IconCloud,
  IconCloudRain,
  IconCompass,
  IconDroplet,
  IconFlame,
  IconLeaf,
  IconLuggage,
  IconMap,
  IconMapPin,
  IconMountain,
  IconPlane,
  IconRoute,
  IconSnowflake,
  IconSunrise,
  IconTicket,
  IconTrain,
  IconTree,
  IconUmbrella,
  IconWind,
} from './travel';
import {
  IconAlarm,
  IconApi,
  IconBattery,
  IconBluetooth,
  IconBug,
  IconCloudUpload,
  IconCommand,
  IconCpu,
  IconCube,
  IconDatabase,
  IconFingerprint,
  IconGitMerge,
  IconGitPullRequest,
  IconHistory,
  IconHourglass,
  IconKeyboard,
  IconLockOpen,
  IconPlug,
  IconPower,
  IconPrinter,
  IconRobot,
  IconServer,
  IconShieldLock,
  IconStopwatch,
  IconWand,
  IconWebhook,
  IconWifi,
  IconWifiOff,
} from './system';

/* Core ---------------------------------------------------------------------------------------------------- */

export const IconCheckDuotone = untinted(IconCheck);
export const IconXDuotone = untinted(IconX);
export const IconChevronRightDuotone = untinted(IconChevronRight);
export const IconSearchDuotone = duotone(IconSearch, body(IconSearch));
export const IconBellDuotone = duotone(IconBell, body(IconBell));
export const IconCalendarDuotone = duotone(IconCalendar, body(IconCalendar));
export const IconUserDuotone = duotone(IconUser, body(IconUser), closed(IconUser, 1));
export const IconSettingsDuotone = duotone(IconSettings, holed(IconSettings, 0, ring(12, 12, 2.5)));
export const IconFileDuotone = duotone(IconFile, body(IconFile));
export const IconTrashDuotone = duotone(IconTrash, closed(IconTrash, 2));
export const IconUploadDuotone = duotone(IconUpload, closed(IconUpload, 1));
export const IconInfoCircleDuotone = duotone(IconInfoCircle, body(IconInfoCircle));

/* Navigation ------------------------------------------------------------------------------------------------ */

export const IconChevronDownDuotone = untinted(IconChevronDown);
export const IconChevronLeftDuotone = untinted(IconChevronLeft);
export const IconArrowRightDuotone = untinted(IconArrowRight);
export const IconArrowLeftDuotone = untinted(IconArrowLeft);
export const IconArrowUpDuotone = untinted(IconArrowUp);
export const IconArrowUpRightDuotone = untinted(IconArrowUpRight);
export const IconArrowDownLeftDuotone = untinted(IconArrowDownLeft);
export const IconArrowDownRightDuotone = untinted(IconArrowDownRight);
export const IconArrowNarrowRightDuotone = untinted(IconArrowNarrowRight);
export const IconArrowsSortDuotone = untinted(IconArrowsSort);
export const IconArrowsExchangeDuotone = untinted(IconArrowsExchange);
export const IconSelectorDuotone = untinted(IconSelector);
// The window is the body, but the outline draws only 3½ of its sides (the arrow leaves the fourth corner), so
// appending Z would chord across that corner instead of closing it. Hand-drawn box, edge on the outline's centreline.
export const IconExternalLinkDuotone = duotone(
  IconExternalLink,
  tint('M8 4.75h8A3.25 3.25 0 0 1 19.25 8v8A3.25 3.25 0 0 1 16 19.25H8A3.25 3.25 0 0 1 4.75 16V8A3.25 3.25 0 0 1 8 4.75Z'),
);
export const IconDownloadDuotone = duotone(IconDownload, closed(IconDownload, 1)); // tray; Z is its open mouth
export const IconLogoutDuotone = duotone(IconLogout, closed(IconLogout, 0)); // door bracket; Z is its open side
export const IconRefreshDuotone = untinted(IconRefresh);
export const IconRotateDuotone = untinted(IconRotate);
export const IconPlusDuotone = untinted(IconPlus);
export const IconDotsDuotone = untinted(IconDots);
export const IconDotsVerticalDuotone = untinted(IconDotsVertical);
export const IconMenu2Duotone = untinted(IconMenu2);
export const IconFilterDuotone = duotone(IconFilter, body(IconFilter));
// Both knobs: the sliders are the subject, the tracks are not.
export const IconAdjustmentsHorizontalDuotone = duotone(
  IconAdjustmentsHorizontal,
  body(IconAdjustmentsHorizontal, 1),
  body(IconAdjustmentsHorizontal, 2),
);
// Front card only. The back card is drawn just where it shows, so it has no fillable subpath, and a hand-drawn one
// would sit under the front card's tint and double the alpha into a visible square.
export const IconCopyDuotone = duotone(IconCopy, body(IconCopy, 0));
export const IconPencilDuotone = duotone(IconPencil, body(IconPencil));
export const IconLinkDuotone = untinted(IconLink);
// Three nodes, three masses; the connectors are not.
export const IconShareDuotone = duotone(IconShare, body(IconShare, 0), body(IconShare, 1), body(IconShare, 2));
export const IconSendDuotone = duotone(IconSend, body(IconSend));

/* Status ---------------------------------------------------------------------------------------------------- */

// The disc is tinted and the glyph stays a drawn stroke on top — the soft alternative to filled.ts, which
// knocks the same glyph out of a solid shape.
export const IconCircleCheckDuotone = duotone(IconCircleCheck, body(IconCircleCheck));
export const IconCircleXDuotone = duotone(IconCircleX, body(IconCircleX));
export const IconAlertTriangleDuotone = duotone(IconAlertTriangle, body(IconAlertTriangle));
export const IconAlertCircleDuotone = duotone(IconAlertCircle, body(IconAlertCircle));
// Glyph-only marks: a bar and a dot enclose nothing.
export const IconExclamationMarkDuotone = untinted(IconExclamationMark);
export const IconInfoSmallDuotone = untinted(IconInfoSmall);
export const IconHelpCircleDuotone = duotone(IconHelpCircle, body(IconHelpCircle));
export const IconShieldCheckDuotone = duotone(IconShieldCheck, body(IconShieldCheck));
// The case only. Filling the shackle's arc would colour the gap under it, not the strap.
export const IconLockDuotone = duotone(IconLock, body(IconLock));
export const IconKeyDuotone = duotone(IconKey, body(IconKey));
// The lens, with the pupil kept as a window so the eye doesn't go blind.
export const IconEyeDuotone = duotone(IconEye, holed(IconEye, 0, ring(12, 12, 2.75)));
// eye-off has no pupil to knock out; the slash crosses the tint.
export const IconEyeOffDuotone = duotone(IconEyeOff, body(IconEyeOff));
export const IconStarDuotone = duotone(IconStar, body(IconStar));
export const IconSparklesDuotone = duotone(IconSparkles, body(IconSparkles), body(IconSparkles, 1));
// Head and flare are one subpath; its implicit close runs along the cap bar, where the body's edge is.
export const IconPinDuotone = duotone(IconPin, body(IconPin));
export const IconClockDuotone = duotone(IconClock, body(IconClock));
// The front person only (head + shoulders), like core's user; the one behind stays an outline.
export const IconUsersDuotone = duotone(IconUsers, body(IconUsers), closed(IconUsers, 1));
export const IconUserPlusDuotone = duotone(IconUserPlus, body(IconUserPlus), closed(IconUserPlus, 1));
export const IconMailDuotone = duotone(IconMail, body(IconMail));
// The @'s inner o is the mass; the swoosh around it is an open arc.
export const IconAtDuotone = duotone(IconAt, body(IconAt));
export const IconInboxDuotone = duotone(IconInbox, body(IconInbox));
// The box, not the lid: closing subpath 1 draws its chord along the lid's bottom edge.
export const IconArchiveDuotone = duotone(IconArchive, closed(IconArchive, 1));
export const IconHomeDuotone = duotone(IconHome, body(IconHome));
export const IconWorldDuotone = duotone(IconWorld, body(IconWorld));
export const IconSunDuotone = duotone(IconSun, body(IconSun));
export const IconMoonDuotone = duotone(IconMoon, body(IconMoon));
// Polylines with an arrowhead: no enclosed area.
export const IconTrendingUpDuotone = untinted(IconTrendingUp);
export const IconTrendingDownDuotone = untinted(IconTrendingDown);

/* Objects --------------------------------------------------------------------------------------------------- */

// File family: the page is the mass; the fold and the mark on it are detail (same call as core's IconFile).
export const IconFileTextDuotone = duotone(IconFileText, body(IconFileText));
export const IconFileCodeDuotone = duotone(IconFileCode, body(IconFileCode));
export const IconFileTypeTsxDuotone = duotone(IconFileTypeTsx, body(IconFileTypeTsx));
export const IconFileTypeCssDuotone = duotone(IconFileTypeCss, body(IconFileTypeCss));
// Two open braces and nothing between them: no page, no enclosed area.
export const IconJsonDuotone = untinted(IconJson);
export const IconFolderDuotone = duotone(IconFolder, body(IconFolder));
export const IconReceiptDuotone = duotone(IconReceipt, body(IconReceipt));
export const IconCreditCardDuotone = duotone(IconCreditCard, body(IconCreditCard));
export const IconWalletDuotone = duotone(IconWallet, body(IconWallet));
// The pediment, not the columns: the columns are lines and the base is open.
export const IconBuildingBankDuotone = duotone(IconBuildingBank, body(IconBuildingBank));
export const IconDeviceDesktopDuotone = duotone(IconDeviceDesktop, body(IconDeviceDesktop));
export const IconDeviceTabletDuotone = duotone(IconDeviceTablet, body(IconDeviceTablet));
export const IconDeviceMobileDuotone = duotone(IconDeviceMobile, body(IconDeviceMobile));
export const IconTerminal2Duotone = duotone(IconTerminal2, body(IconTerminal2));
// Two chevrons and a slash: bare polylines.
export const IconCodeDuotone = untinted(IconCode);
// The three commit nodes are the subject; the trunk and branch are lines.
export const IconGitBranchDuotone = duotone(
  IconGitBranch,
  body(IconGitBranch, 0),
  body(IconGitBranch, 1),
  body(IconGitBranch, 2),
);
// One subpath holds all four diamonds, so one body() tints the whole cluster.
export const IconComponentsDuotone = duotone(IconComponents, body(IconComponents));
export const IconTableDuotone = duotone(IconTable, body(IconTable));
export const IconLayoutListDuotone = duotone(
  IconLayoutList,
  body(IconLayoutList, 0),
  body(IconLayoutList, 1),
  body(IconLayoutList, 2),
);
export const IconLayoutGridDuotone = duotone(
  IconLayoutGrid,
  body(IconLayoutGrid, 0),
  body(IconLayoutGrid, 1),
  body(IconLayoutGrid, 2),
  body(IconLayoutGrid, 3),
);
export const IconLayoutRowsDuotone = duotone(IconLayoutRows, body(IconLayoutRows));
export const IconLayoutDashboardDuotone = duotone(
  IconLayoutDashboard,
  body(IconLayoutDashboard, 0),
  body(IconLayoutDashboard, 1),
  body(IconLayoutDashboard, 2),
  body(IconLayoutDashboard, 3),
);
// The track is the mass and the knob must stay a window, but holed() needs a `d` and the track is a <rect>:
// this redraws rect(3,7,18,10,rx 5) on its centreline, with the knob reversed so non-zero fill knocks it out.
export const IconToggleDuotone = duotone(
  IconToggle,
  tint('M8 7h8a5 5 0 0 1 0 10H8A5 5 0 0 1 8 7ZM18.75 12a2.75 2.75 0 1 0-5.5 0a2.75 2.75 0 1 0 5.5 0Z'),
);
export const IconBaselineDensitySmallDuotone = untinted(IconBaselineDensitySmall);
export const IconBaselineDensityMediumDuotone = untinted(IconBaselineDensityMedium);
export const IconTextDirectionLtrDuotone = untinted(IconTextDirectionLtr);
export const IconTextDirectionRtlDuotone = untinted(IconTextDirectionRtl);
// The rail is the subject, not the panel around it; the panel's own <rect> can't express a half, so it's drawn
// here on the outline's centreline (the closing edge is exactly the rail stroke at x 9.5).
export const IconLayoutSidebarDuotone = duotone(
  IconLayoutSidebar,
  tint('M9.5 4H7.5A4.5 4.5 0 0 0 3 8.5v7A4.5 4.5 0 0 0 7.5 20h2z'),
);
export const IconSquareSmallDuotone = duotone(IconSquareSmall, body(IconSquareSmall));

/* Health ---------------------------------------------------------------------------------------------------- */

// Tubing encloses air; the chest piece is the one mass.
export const IconStethoscopeDuotone = duotone(IconStethoscope, body(IconStethoscope, 2));
export const IconPillDuotone = duotone(IconPill, body(IconPill));
export const IconCapsuleDuotone = duotone(IconCapsule, body(IconCapsule));
export const IconSyringeDuotone = duotone(IconSyringe, body(IconSyringe));
export const IconHeartPulseDuotone = duotone(IconHeartPulse, body(IconHeartPulse));
export const IconHeartDuotone = duotone(IconHeart, body(IconHeart));
// Subpath 0 also holds the ground line; the chord runs along it, so the fill is the building.
export const IconHospitalDuotone = duotone(IconHospital, closed(IconHospital, 0));
export const IconFirstAidKitDuotone = duotone(IconFirstAidKit, body(IconFirstAidKit));
export const IconThermometerDuotone = duotone(IconThermometer, body(IconThermometer));
export const IconToothDuotone = duotone(IconTooth, body(IconTooth));
// Two strands and three rungs: every enclosed area is air between the strands, not the helix.
export const IconDnaDuotone = untinted(IconDna);
export const IconMicroscopeDuotone = duotone(IconMicroscope, body(IconMicroscope));
export const IconBandageDuotone = duotone(IconBandage, body(IconBandage));
// The wheel is a 190° arc: its chord cuts the disc in half, and the figure is line work. A lone tinted head
// read as a stray dot at 16px, so the mark keeps no tint.
export const IconWheelchairDuotone = untinted(IconWheelchair);
export const IconBabyDuotone = duotone(IconBaby, body(IconBaby));
export const IconAppleDuotone = duotone(IconApple, body(IconApple));
export const IconDumbbellDuotone = duotone(IconDumbbell, body(IconDumbbell, 0), body(IconDumbbell, 1));
// The quilt: the outline leaves it open and its chord would cut the bed in half, so trace it to the frame line.
export const IconBedDuotone = duotone(IconBed, tint('M10.5 16.5V10h6.75a3.25 3.25 0 0 1 3.25 3.25v3.25Z'));
// The chord closes the van along the axle line the wheels sit on.
export const IconAmbulanceDuotone = duotone(IconAmbulance, closed(IconAmbulance, 0));
export const IconTestTubeDuotone = duotone(IconTestTube, closed(IconTestTube, 0));
export const IconLungsDuotone = duotone(IconLungs, body(IconLungs, 1), body(IconLungs, 2));
// Each hemisphere closes on the centre line the outline already draws.
export const IconBrainDuotone = duotone(IconBrain, closed(IconBrain, 0), closed(IconBrain, 1));
export const IconVirusDuotone = duotone(IconVirus, body(IconVirus));
export const IconFaceMaskDuotone = duotone(IconFaceMask, body(IconFaceMask));
export const IconGlassesDuotone = duotone(IconGlasses, body(IconGlasses, 0), body(IconGlasses, 1));
export const IconPrescriptionDuotone = duotone(IconPrescription, body(IconPrescription));
export const IconAccessibleDuotone = duotone(IconAccessible, body(IconAccessible));
// Stick figure: limbs enclose nothing and the head's r=1.75 ring leaves a sliver that disappears at 16px.
export const IconWalkDuotone = untinted(IconWalk);

/* Commerce -------------------------------------------------------------------------------------------------- */

export const IconCoinDuotone = duotone(IconCoin, body(IconCoin));
// The outline draws the back coin only where it shows, so neither its mass nor the pair is a subpath. Both circles
// live in one path, so the overlap doesn't double the tint; closing the back arc instead would.
export const IconCoinsDuotone = duotone(
  IconCoins,
  tint('M15 14.25a5.75 5.75 0 1 1-11.5 0a5.75 5.75 0 1 1 11.5 0M9.14 8.5a5.75 5.75 0 1 1 5.72 7a5.75 5.75 0 0 1-5.72-7Z'),
);
export const IconCurrencyRupeeDuotone = untinted(IconCurrencyRupee);
export const IconCurrencyDollarDuotone = untinted(IconCurrencyDollar);
export const IconCurrencyEuroDuotone = untinted(IconCurrencyEuro);
export const IconPiggyBankDuotone = duotone(IconPiggyBank, body(IconPiggyBank));
export const IconChartPieDuotone = duotone(IconChartPie, body(IconChartPie), body(IconChartPie, 1));
export const IconChartBarDuotone = duotone(IconChartBar, body(IconChartBar), body(IconChartBar, 1), body(IconChartBar, 2));
export const IconChartLineDuotone = untinted(IconChartLine);
export const IconFileInvoiceDuotone = duotone(IconFileInvoice, body(IconFileInvoice));
export const IconCashDuotone = duotone(IconCash, body(IconCash));
export const IconReceiptRefundDuotone = duotone(IconReceiptRefund, body(IconReceiptRefund));
export const IconPercentageDuotone = untinted(IconPercentage);
// The basket isn't a subpath: the outline draws handle and basket as one stroke, and closing it cuts a wedge
// across the handle. Traced on the basket's own centrelines; the handle and the two dot wheels stay outline.
export const IconShoppingCartDuotone = duotone(
  IconShoppingCart,
  tint('M6.6 7.75H19a1.25 1.25 0 0 1 1.21 1.5l-1.2 5.1a2 2 0 0 1-1.95 1.55H9.86a2 2 0 0 1-1.96-1.6Z'),
);
export const IconShoppingBagDuotone = duotone(IconShoppingBag, body(IconShoppingBag));
export const IconTagDuotone = duotone(IconTag, body(IconTag));
export const IconDiscountDuotone = duotone(IconDiscount, body(IconDiscount));
// Subpath 1 is the shopfront and the door, and the door winds the other way, so nonzero leaves the doorway open.
export const IconBuildingStoreDuotone = duotone(IconBuildingStore, body(IconBuildingStore, 1));
// Box and cab are two subpaths of one stroke that the fill would close on diagonals, so both are traced on their
// own centrelines; they abut at x=14.25, so the tint reads as one truck. The underside arcs over each wheel, on the
// wheel's own centreline, so the tint keeps the wheels clear and no tint edge is left without a stroke over it.
export const IconTruckDuotone = duotone(
  IconTruck,
  tint(
    'M5.25 17a2.25 2.25 0 0 1-2.25-2.25v-7A2.25 2.25 0 0 1 5.25 5.5H12a2.25 2.25 0 0 1 2.25 2.25V17H9.5a2 2 0 0 0-4 0Z' +
      'M14.25 9.25h3.05c.7 0 1.35.37 1.72.98l1.45 2.44c.18.31.28.66.28 1.02V15a2 2 0 0 1-2 2h-.25a2 2 0 0 0-4 0H14.25Z',
  ),
);
export const IconPackageDuotone = duotone(IconPackage, body(IconPackage));
export const IconBarcodeDuotone = untinted(IconBarcode);
export const IconQrcodeDuotone = duotone(IconQrcode, body(IconQrcode));
export const IconGiftDuotone = duotone(IconGift, body(IconGift), closed(IconGift, 1));
export const IconSafeDuotone = duotone(IconSafe, body(IconSafe));
// Subpath 2 is the pair of bowls, both already closed.
export const IconScaleDuotone = duotone(IconScale, body(IconScale, 2));
export const IconCalculatorDuotone = duotone(IconCalculator, body(IconCalculator));
// The coin. The hand is two open strokes with no shared closing edge, so it stays outline.
export const IconHandCoinDuotone = duotone(IconHandCoin, body(IconHandCoin));
export const IconTrophyDuotone = duotone(IconTrophy, body(IconTrophy));

/* Media ----------------------------------------------------------------------------------------------------- */

export const IconMessageDuotone = duotone(IconMessage, body(IconMessage));
export const IconMessageDotsDuotone = duotone(IconMessageDots, body(IconMessageDots));
export const IconPhoneDuotone = duotone(IconPhone, body(IconPhone));
export const IconPhoneCallDuotone = duotone(IconPhoneCall, body(IconPhoneCall));
// Body and lens are one silhouette; the lens path closes along x=15.5, the body's own right edge.
export const IconVideoDuotone = duotone(IconVideo, body(IconVideo), closed(IconVideo, 1));
export const IconMicrophoneDuotone = duotone(IconMicrophone, body(IconMicrophone));
export const IconMicrophoneOffDuotone = duotone(IconMicrophoneOff, body(IconMicrophoneOff));
// A spiral clip encloses no area.
export const IconPaperclipDuotone = untinted(IconPaperclip);
export const IconPhotoDuotone = duotone(IconPhoto, body(IconPhoto));
// The lens is knocked out, or the tint floods the one hole the camera has.
export const IconCameraDuotone = duotone(IconCamera, holed(IconCamera, 0, ring(12, 13.25, 3.25)));
export const IconMusicDuotone = duotone(IconMusic, body(IconMusic), body(IconMusic, 1));
export const IconPlayerPlayDuotone = duotone(IconPlayerPlay, body(IconPlayerPlay));
export const IconPlayerPauseDuotone = duotone(IconPlayerPause, body(IconPlayerPause), body(IconPlayerPause, 1));
export const IconPlayerStopDuotone = duotone(IconPlayerStop, body(IconPlayerStop));
export const IconPlayerSkipForwardDuotone = duotone(IconPlayerSkipForward, body(IconPlayerSkipForward));
export const IconVolumeDuotone = duotone(IconVolume, body(IconVolume));
export const IconVolumeOffDuotone = duotone(IconVolumeOff, body(IconVolumeOff));
export const IconMovieDuotone = duotone(IconMovie, body(IconMovie));
// The band is a bare arc; the two ear cups are the mass.
export const IconHeadphonesDuotone = duotone(IconHeadphones, body(IconHeadphones, 1), body(IconHeadphones, 2));
export const IconBroadcastDuotone = untinted(IconBroadcast);
export const IconRssDuotone = untinted(IconRss);
// The front sheet is the body, but it shares a path element with the rolled back column, and filling both leaves an
// unfilled wedge where the column's implicit close cuts from (16.75,8.5) to (18.5,20). This is subpath 0's first
// contour, redrawn on its own centreline; the column behind stays clear.
export const IconNewsDuotone = duotone(
  IconNews,
  tint('M18.5 20H7a3.25 3.25 0 0 1-3.25-3.25V6.5A2.5 2.5 0 0 1 6.25 4h8a2.5 2.5 0 0 1 2.5 2.5v11.75a1.75 1.75 0 0 0 1.75 1.75Z'),
);
export const IconBookDuotone = duotone(IconBook, body(IconBook));
export const IconBookmarkDuotone = duotone(IconBookmark, body(IconBookmark));
// Z runs back up the pole (x=5.5), so the tint is the pennant alone.
export const IconFlagDuotone = duotone(IconFlag, closed(IconFlag, 0));
export const IconBellOffDuotone = duotone(IconBellOff, body(IconBellOff));
// Cuff, then the hand closed along x=7.5 — the cuff's right edge.
export const IconThumbUpDuotone = duotone(IconThumbUp, body(IconThumbUp), closed(IconThumbUp, 1));
export const IconMoodSmileDuotone = duotone(IconMoodSmile, body(IconMoodSmile));

/* Travel ---------------------------------------------------------------------------------------------------- */

export const IconMapDuotone = duotone(IconMap, body(IconMap));
export const IconMapPinDuotone = duotone(IconMapPin, body(IconMapPin));
export const IconCompassDuotone = duotone(IconCompass, body(IconCompass));
export const IconPlaneDuotone = duotone(IconPlane, body(IconPlane));
export const IconCarDuotone = duotone(IconCar, body(IconCar));
export const IconBusDuotone = duotone(IconBus, body(IconBus));
export const IconTrainDuotone = duotone(IconTrain, body(IconTrain));
// Two wheels are the mass; the frame's Z chord would run through open space between them.
export const IconBikeDuotone = duotone(IconBike, body(IconBike, 0), body(IconBike, 1));
export const IconBuildingDuotone = duotone(IconBuilding, body(IconBuilding));
// Tower plus the low block beside it; the block's Z chord lands on the tower's right edge (x=13.75).
export const IconBuildingsDuotone = duotone(IconBuildings, body(IconBuildings, 0), closed(IconBuildings, 1));
export const IconBriefcaseDuotone = duotone(IconBriefcase, body(IconBriefcase));
export const IconLuggageDuotone = duotone(IconLuggage, body(IconLuggage));
export const IconCloudDuotone = duotone(IconCloud, body(IconCloud));
export const IconCloudRainDuotone = duotone(IconCloudRain, body(IconCloudRain));
export const IconSnowflakeDuotone = untinted(IconSnowflake);
export const IconBoltDuotone = duotone(IconBolt, body(IconBolt));
export const IconLeafDuotone = duotone(IconLeaf, body(IconLeaf));
export const IconTreeDuotone = duotone(IconTree, body(IconTree));
export const IconFlameDuotone = duotone(IconFlame, body(IconFlame));
export const IconDropletDuotone = duotone(IconDroplet, body(IconDroplet));
export const IconMountainDuotone = duotone(IconMountain, body(IconMountain));
export const IconUmbrellaDuotone = duotone(IconUmbrella, body(IconUmbrella));
// The only closed subpath is the shackle ring, whose inside is a hole, not a body; the stroke leaves r≈1.25 of it.
export const IconAnchorDuotone = untinted(IconAnchor);
export const IconTicketDuotone = duotone(IconTicket, body(IconTicket));
export const IconCalendarEventDuotone = duotone(IconCalendarEvent, body(IconCalendarEvent));
// Z closes to the last M, so subpath 0 tints the half sun on the horizon and leaves the rays outline.
export const IconSunriseDuotone = duotone(IconSunrise, closed(IconSunrise, 0));
export const IconWindDuotone = untinted(IconWind);
// The S is a polyline; the two r=2 end nodes are the only fillable area and are a sliver once the stroke covers them.
// The two waypoints are the icon's masses, like share's nodes and git-branch's commits; small, so the
// second tone shows from ~24px. anchor's ring is left alone because it reads as a hole, not a mass.
export const IconRouteDuotone = duotone(IconRoute, body(IconRoute), body(IconRoute, 1));

/* System ---------------------------------------------------------------------------------------------------- */

// The cylinder is drawn as a lid ellipse plus open sides, so no subpath is the silhouette: top half of the lid,
// down the sides, round the base. Filling the lid alone would leave the barrel empty; closing the sides alone
// would cut a straight chord through the lid.
export const IconDatabaseDuotone = duotone(IconDatabase, tint('M5 6.5a7 2.75 0 0 1 14 0v11a7 2.75 0 0 1-14 0Z'));
export const IconServerDuotone = duotone(IconServer, body(IconServer, 0), body(IconServer, 1));
// The cloud is open at its base where the arrow passes; Z runs along that base line.
export const IconCloudUploadDuotone = duotone(IconCloudUpload, closed(IconCloudUpload, 0));
export const IconCpuDuotone = duotone(IconCpu, body(IconCpu, 0));
// Body and head: Z on the head arc lands on the body's top edge.
export const IconBugDuotone = duotone(IconBug, body(IconBug, 0), closed(IconBug, 1));
// The three nodes are the only fillable mass in a git graph; the branch lines enclose nothing.
export const IconGitMergeDuotone = duotone(
  IconGitMerge,
  body(IconGitMerge, 0),
  body(IconGitMerge, 1),
  body(IconGitMerge, 2),
);
export const IconGitPullRequestDuotone = duotone(
  IconGitPullRequest,
  body(IconGitPullRequest, 0),
  body(IconGitPullRequest, 1),
  body(IconGitPullRequest, 2),
);
// Three hooks and three solid dots: no enclosed area.
export const IconWebhookDuotone = untinted(IconWebhook);
// Ridges, not a body.
export const IconFingerprintDuotone = untinted(IconFingerprint);
export const IconLockOpenDuotone = duotone(IconLockOpen, body(IconLockOpen, 0));
export const IconShieldLockDuotone = duotone(IconShieldLock, body(IconShieldLock, 0));
export const IconWifiDuotone = untinted(IconWifi);
export const IconWifiOffDuotone = untinted(IconWifiOff);
export const IconBluetoothDuotone = untinted(IconBluetooth);
export const IconBatteryDuotone = duotone(IconBattery, body(IconBattery, 0));
// The ring is open at the top where the stem sits; Z closes it across that mouth.
// The disc is the mass, but the ring's mouth is the mark: closing across it tinted the slot the stem passes
// through, and the whole thing read as a filled button. The window keeps that break open (Anuj, 2026-09-29).
export const IconPowerDuotone = duotone(IconPower, holed(IconPower, 0, 'M10.85 3.5h2.3v6.1a1.15 1.15 0 0 1-2.3 0Z'));
export const IconPlugDuotone = duotone(IconPlug, body(IconPlug, 0));
export const IconRobotDuotone = duotone(IconRobot, body(IconRobot, 0));
// The stick encloses nothing and the sparkle's concave arms leave only a sliver, gone by 32px.
export const IconWandDuotone = untinted(IconWand);
export const IconCommandDuotone = duotone(IconCommand, body(IconCommand, 0));
export const IconKeyboardDuotone = duotone(IconKeyboard, body(IconKeyboard, 0));
// The chassis, with the paper tray knocked out: the tray is drawn over the chassis, so a plain fill would show a
// tint edge across it. The window's sides sit on the tray's own strokes and its base on the chassis' bottom edge.
export const IconPrinterDuotone = duotone(IconPrinter, holed(IconPrinter, 1, 'M7.25 13.5H16.75V17H7.25Z'));
// The dial is an open arc with an arrowhead in the gap, not a circle subpath.
export const IconHistoryDuotone = duotone(IconHistory, tint(ring(12, 12, 7.25)));
// Two bulbs made by two crossing curves plus the caps: neither subpath is a bulb, so each is traced once.
export const IconHourglassDuotone = duotone(
  IconHourglass,
  tint(
    'M8 3.75H16v2.75c0 2.1-1.9 3.6-4 5.5C9.9 10.1 8 8.6 8 6.5ZM8 20.25H16v-2.75c0-2.1-1.9-3.6-4-5.5C9.9 13.9 8 15.4 8 17.5Z',
  ),
);
export const IconAlarmDuotone = duotone(IconAlarm, body(IconAlarm, 0));
export const IconStopwatchDuotone = duotone(IconStopwatch, body(IconStopwatch, 0));
// Two braces and a dot: no enclosed area.
export const IconApiDuotone = untinted(IconApi);
export const IconCubeDuotone = duotone(IconCube, body(IconCube, 0));
