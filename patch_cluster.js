const fs = require('fs');

const file = 'super_admin.html';
if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Add areaId to Marker options
    const oldMarker = `                    const m = L.marker([finalLat, finalLng], {
                        icon: pulseIcon
                    }).bindPopup(\``;
                    
    const newMarker = `                    const m = L.marker([finalLat, finalLng], {
                        icon: pulseIcon,
                        areaId: dev.areaId
                    }).bindPopup(\``;

    if (content.includes(oldMarker)) {
        content = content.replace(oldMarker, newMarker);
    } else {
        console.log("Could not find marker creation block");
    }

    // 2. Add iconCreateFunction to markerClusterGroup
    const oldCluster = `            markerClusterGroup = L.markerClusterGroup({
                disableClusteringAtZoom: 15,
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                chunkedLoading: true
            });`;
            
    const newCluster = `            markerClusterGroup = L.markerClusterGroup({
                disableClusteringAtZoom: 15,
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                chunkedLoading: true,
                iconCreateFunction: function(cluster) {
                    const markers = cluster.getAllChildMarkers();
                    let areaName = null;
                    let isMixed = false;
                    let hasArea = false;
                    
                    markers.forEach(m => {
                        const mAreaId = m.options.areaId;
                        if (mAreaId && typeof areaMap !== 'undefined' && areaMap[mAreaId]) {
                            const name = areaMap[mAreaId];
                            if (!hasArea) {
                                areaName = name;
                                hasArea = true;
                            } else if (areaName !== name) {
                                isMixed = true;
                            }
                        }
                    });
                    
                    let label = markers.length + " ตู้";
                    if (isMixed) {
                        label = "หลายพื้นที่ (" + markers.length + " ตู้)";
                    } else if (hasArea) {
                        label = areaName + " (" + markers.length + ")";
                    }
                    
                    return L.divIcon({
                        html: '<div class="absolute -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 dark:bg-slate-100/95 backdrop-blur-sm text-white dark:text-slate-900 font-bold text-[11px] px-3 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_rgba(255,255,255,0.3)] border border-slate-700/50 dark:border-slate-300/50 whitespace-nowrap flex items-center justify-center">' + label + '</div>',
                        className: '',
                        iconSize: [0, 0]
                    });
                }
            });`;

    if (content.includes(oldCluster)) {
        content = content.replace(oldCluster, newCluster);
    } else {
        console.log("Could not find cluster group init");
    }

    fs.writeFileSync(file, content);
    console.log('Successfully patched map clustering to show area names');
}
