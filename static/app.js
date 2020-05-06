const parser = new DOMParser();
let gpxLayer = null;
let index = null;
let map = null;

window.addEventListener('load', () => {
	Loader.async = true;
	Loader.load(null, null, async () => {
		initMap();
		index = await fetchIndex();
		initApp();
	});
});

const initMap = () => {
	const point = SMap.Coords.fromWGS84(14.41, 50.08);
	map = new SMap(document.getElementById('map'), point, 10);

	map.addDefaultLayer(SMap.DEF_BASE).enable();
	map.addDefaultControls();

	const mouse = new SMap.Control.Mouse(SMap.MOUSE_PAN | SMap.MOUSE_WHEEL | SMap.MOUSE_ZOOM);
	map.addControl(mouse);

	const sync = new SMap.Control.Sync();
	map.addControl(sync);
};

const initApp = () => {
	renderTracks(index);
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

const renderTracks = tracks => {
	const IS_ACTIVE_CLASS = 'is-active';
	const listElm = document.getElementById('tracks');
	listElm.innerHTML = '';

	tracks.forEach(track => {
		const trackElm = document.createElement('li');

		const trackButton = document.createElement('a');
		trackButton.textContent = track.name;
		trackButton.addEventListener('click', event => {
			event.preventDefault();

			document.querySelectorAll(`#tracks .${IS_ACTIVE_CLASS}`).forEach(child => child.classList.remove(IS_ACTIVE_CLASS));
			trackButton.classList.add(IS_ACTIVE_CLASS);
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

	const trackDistanceElm = document.getElementById('track-distance');
	trackDistanceElm.innerText = Math.round((track.distance / 1000 + Number.EPSILON) * 100) / 100;

	const trackHiddenElms = document.querySelectorAll('.card .is-hidden');
	trackHiddenElms.forEach(trackHiddenElm => trackHiddenElm.classList.remove('is-hidden'));
};

const fetchTrack = async track => {
	const response = await fetch(`/trips/${track.file}`, {
		cache: 'no-cache',
		headers: {
			'Content-Type': 'application/xml'
		},
	});

	return response.text();
};
