const parser = new DOMParser();
let gpxLayer = null;
let index = null;
let map = null;

const DOMAIN = 'cyklotripy.cz';
const IS_ACTIVE_CLASS = 'is-active';
const TRACK_URL_PARAMETER = 'track';
const TRACKS_ID = 'tracks';

window.addEventListener('load', () => {
	Loader.async = true;
	Loader.load(null, { poi:true }, async () => {
		initMap();
		index = await fetchIndex();
		initApp();
	});
});

const getTrackUrl = track => `/trips/${track.file}`;

const getUrlParameter = (name, defaultValue = '') => {
	const pairs = location.search.substr(1).split("&");

	for (const pair of pairs) {
		const tmp = pair.split("=");

		if (tmp[0] === name) {
			return decodeURIComponent(tmp[1]);
		}
	}

	return defaultValue;
};

const initApp = () => {
	renderTracks(index);
	selectTrackFromQuery();
};

const initMap = () => {
	const point = SMap.Coords.fromWGS84(14.41, 50.08);
	map = new SMap(document.getElementById('map'), point, 10);

	map.addDefaultLayer(SMap.DEF_BASE).enable();
	map.addDefaultControls();

	const layerPoi = new SMap.Layer.Marker(undefined, {
		poiTooltip: true
	});
	map.addLayer(layerPoi).enable();

	const dataProvider = map.createDefaultDataProvider();
	dataProvider.setOwner(map);
	dataProvider.addLayer(layerPoi);
	dataProvider.setMapSet(SMap.MAPSET_BASE);
	dataProvider.enable();

	const mouse = new SMap.Control.Mouse(SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM);
	map.addControl(mouse);

	const sync = new SMap.Control.Sync();
	map.addControl(sync);
};

const fetchIndex = async () => {
	const response = await fetch('/static/index.json', {
		cache: 'no-cache',
		headers: {
			'Content-Type': 'application/json'
		},
	});

	return response.json();
};

const fetchTrack = async track => {
	const response = await fetch(getTrackUrl(track), {
		cache: 'no-cache',
		headers: {
			'Content-Type': 'application/xml'
		},
	});

	return response.text();
};

const renderTracks = tracks => {
	const listElm = document.getElementById(TRACKS_ID);
	listElm.innerHTML = '';

	tracks.forEach(track => {
		const trackElm = document.createElement('li');

		const trackButton = document.createElement('a');
		trackButton.textContent = track.name;
		trackButton.href = getTrackUrl(track);
		trackButton.addEventListener('click', event => {
			event.preventDefault();

			selectTrack(track);
		});
		trackElm.appendChild(trackButton);

		listElm.appendChild(trackElm);
	});
};

const selectTrack = async track => {
	if (gpxLayer) {
		map.removeLayer(gpxLayer);
	}

	gpxLayer = new SMap.Layer.GPX(
		parser.parseFromString(await fetchTrack(track), 'application/xml'),
		null,
		{
			colors: ['#ff0000']
		}
	);
	map.addLayer(gpxLayer);
	gpxLayer.enable();
	gpxLayer.fit();

	document.querySelectorAll(`#${TRACKS_ID} .${IS_ACTIVE_CLASS}`).forEach(child => child.classList.remove(IS_ACTIVE_CLASS));
	document.querySelector(`#${TRACKS_ID} a[href="${getTrackUrl(track)}"]`).classList.add(IS_ACTIVE_CLASS);

	const trackDistanceElm = document.getElementById('track-distance');
	trackDistanceElm.innerText = `${Math.round((track.distance / 1000 + Number.EPSILON) * 100) / 100}\xa0km`;

	const shareQuery = `?${TRACK_URL_PARAMETER}=${encodeURIComponent(getTrackUrl(track))}`;
	const shareUrl = `https://${DOMAIN}${shareQuery}`;

	const trackShareFacebookElm = document.getElementById('track-share-facebook');
	trackShareFacebookElm.href = `https://www.facebook.com/sharer.php?u=${shareUrl}`;

	const trackShareTwitterElm = document.getElementById('track-share-twitter');
	trackShareTwitterElm.href = `https://twitter.com/intent/tweet?url=${shareUrl}`;

	const trackDependentElms = document.querySelectorAll('[data-track-dependent]');
	trackDependentElms.forEach(trackDependentElm => trackDependentElm.classList.remove('is-hidden'));

	history.pushState(null, '', shareQuery);
};

const selectTrackFromQuery = () => {
	const trackUrl = getUrlParameter(TRACK_URL_PARAMETER);

	if (trackUrl) {
		const track = document.querySelector(`#${TRACKS_ID} a[href="${trackUrl}"]`);

		track && track.click();
	}
};
