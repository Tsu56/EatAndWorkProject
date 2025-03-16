let workingPlaceType = [];
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/data/workplace_types.csv')
    let data = await response.text()
    data = data.split('\n').map(row => row.split(',').map(cell => cell.trim()))
    const header = data.shift()
    data = data.filter(row => row.length == header.length)
    for (const row of data) {
        let obj = {}
        for (let i = 0; i < row.length; i++) {
            obj[header[i]] = row[i]
        }
        workingPlaceType.push(obj)
    }
});

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Search",
    "esri/layers/FeatureLayer",
    "esri/widgets/Editor",
    "esri/renderers/UniqueValueRenderer",
    "esri/layers/CSVLayer",
    "esri/symbols/PictureMarkerSymbol",
    "esri/widgets/LayerList",
    "esri/widgets/Legend",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Home",
    "esri/widgets/Expand",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Sketch",
    "esri/symbols/TextSymbol"
],
    (
        Map,
        MapView,
        Search,
        FeatureLayer,
        Editor,
        UniqueValueRenderer,
        CSVLayer,
        PictureMarkerSymbol,
        LayerList,
        Legend,
        BasemapGallery,
        Home,
        Expand,
        GraphicsLayer,
        Sketch,
        TextSymbol
    ) => {

        const sketchGraphicsLayer = new GraphicsLayer({
            title: "Sketch Graphics"
        });

        const map = new Map({
            basemap: "streets-navigation-vector",
            layers: [sketchGraphicsLayer]
        });

        const view = new MapView({
            container: "viewDiv", // Reference to the DOM node that will contain the view
            map: map, // References the map object created in step 3
            zoom: 12, // Sets zoom level based on level of detail (LOD)
            center: [102.83, 16.46], // Sets center point of view using longitude,latitude
        });

        const classBreakValueRestaurantRating = [
            {
                minValue: 0,
                maxValue: 1,
                label: 'ร้านอาหารระดับ 1 ดาว',
                img_path: '/img/restaurant/type/Rate/1.png'
            },
            {
                minValue: 1.1,
                maxValue: 2,
                label: 'ร้านอาหารระดับ 2 ดาว',
                img_path: '/img/restaurant/type/Rate/2.png'
            },
            {
                minValue: 2.1,
                maxValue: 3,
                label: 'ร้านอาหารระดับ 3 ดาว',
                img_path: '/img/restaurant/type/Rate/3.png'
            },
            {
                minValue: 3.1,
                maxValue: 4,
                label: 'ร้านอาหารระดับ 4 ดาว',
                img_path: '/img/restaurant/type/Rate/4.png'
            },
            {
                minValue: 4.1,
                maxValue: 5,
                label: 'ร้านอาหารระดับ 5 ดาว',
                img_path: '/img/restaurant/type/Rate/5.png'
            }
        ]

        const restaurantRatingMarkRenderer = {
            type: "class-breaks",
            field: "rating",
            classBreakInfos: classBreakValueRestaurantRating.map(data => {
                return {
                    minValue: data.minValue,
                    maxValue: data.maxValue,
                    symbol: new PictureMarkerSymbol({
                        url: data.img_path,
                        width: "52px",
                        height: "52px"
                    }),
                    label: data.label,
                    labelPlacement: "center"
                }
            }),
        };

        const restaurantHeatmapRenderer = {
            type: "heatmap",
            colorStops: [
                {
                    ratio: 0,
                    color: "rgba(189, 189, 189, 0)"
                },
                {
                    ratio: 0.2,
                    color: "#FEFAE0"
                },
                {
                    ratio: 0.5,
                    color: "#FFCF50"
                },
                {
                    ratio: 0.8,
                    color: "#A4B465"
                },
                {
                    ratio: 1,
                    color: "#626F47"
                }
            ],
            minDensity: 0,
            maxDensity: 0.01,
            radius: 10
        };

        const restaurantFeatureLayer = new FeatureLayer({
            url: 'https://services5.arcgis.com/cpLgq9Yb3iruosHo/arcgis/rest/services/restaurant/FeatureServer',
            title: 'ร้านอาหาร (Feature Layer)',
            outFields: ["*"],
            renderer: restaurantRatingMarkRenderer,
            minScale: 0,
            maxScale: 0
        });

        restaurantFeatureLayer.when(() => {
            restaurantFeatureLayer.popupTemplate = {
                title: "🍽️ {name}",
                content: async function (event) {
                    try {
                        const attributes = event.graphic.attributes;
                        const objectId = attributes.ObjectId;

                        let fullImgPath = ``;
                        console.log(objectId)

                        try {
                            // ดึง attachments
                            const result = await restaurantFeatureLayer.queryAttachments({
                                objectIds: [objectId]
                            });

                            const attachmentInfos = result[objectId];
                            if (attachmentInfos && attachmentInfos.length > 0) {
                                fullImgPath = `${restaurantFeatureLayer.url}/0/${objectId}/attachments/${attachmentInfos[0].id}?token=${loginToken}`;
                                console.log(fullImgPath)
                            } else {
                                fullImgPath = `${location.origin}${attributes.image_path}`;
                            }
                        } catch (error) {
                            console.error("Error retrieving attachments:", error);
                            fullImgPath = `${location.origin}${attributes.image_path}`;
                        }

                        return `
                        <p class="!m-0"><strong>ชื่อ:</strong> ${attributes.name}</p>
                        <p class="!m-0"><strong>ประเภท:</strong> ${attributes.type}</p>
                        <p class="!m-0"><strong>🕛 เวลาทำการ:</strong> ${attributes.opening_hour}</p>
                        <p class="!m-0"><strong>⭐ คะแนน:</strong> ${attributes.rating} / 5</p>
                        <img src="${fullImgPath}" alt="${attributes.name}" width="100%">
                        `;
                    } catch (error) {
                        console.error("Error:", error);
                        return "Error";
                    }
                }
            };
        });

        const workingPlacePopupTemplate = {
            title: "{place_name}",
            content: function (feature) {
                let attributes = feature.graphic.attributes;
                let fullImagePath = `${location.origin}${attributes.image_path}`
                return `
                <div class="flex flex-col">
                    <p class="!m-0"><strong>ชื่อสถานที่:</strong> ${attributes.place_name}</p>
                    <p class="!m-0"><strong>ประเภท:</strong> ${attributes.type}</p>
                    <p class="!m-0"><strong>🕛 เวลาทำการ:</strong> ${attributes.opening_hour}</p>
                    <p class="!m-0"><strong>⭐ คะแนน:</strong> ${attributes.rating} / 5</p>
                    <img src="${fullImagePath}" alt="${attributes.name}" width="100%">
                </div>
                `;
            }
        }

        const workingPlaceMarkRenderer = new UniqueValueRenderer({
            field: "type",
            defaultSymbol: new PictureMarkerSymbol({
                url: '/img/type_workplace/Default.png',
                width: "32px",
                height: "32px",
                angle: 0
            }),
            defaultLabel: 'สถานที่น่านั่งทำงานอื่นๆ',
            uniqueValueInfos: workingPlaceType.map(row => {
                const obj = {
                    value: row.type_en,
                    symbol: new PictureMarkerSymbol({
                        url: row.image_path,
                        width: "28px",
                        height: "28px",
                        angle: 0
                    }),
                    label: row.type
                }
                return obj
            })
        });

        const workingPlaceHeatmapRenderer = {
            type: "heatmap",
            colorStops: [{
                ratio: 0,
                color: "rgba(255, 255, 255, 0)"
            },
            {
                ratio: 0.2,
                color: "#B5A8D5"
            },
            {
                ratio: 0.5,
                color: "#7A73D1"
            },
            {
                ratio: 0.8,
                color: "#4D55CC"
            },
            {
                ratio: 1,
                color: "#211C84"
            }
            ],
            minDensity: 0,
            maxDensity: 0.01,
            radius: 10
        };

        const workingPlaceCSVLayer = new CSVLayer({
            url: location.origin + '/data/workplace.csv',
            title: 'สถานที่น่านั่งทำงาน จ.ขอนแก่น (CSVLayer)',
            renderer: workingPlaceMarkRenderer,
            popupTemplate: workingPlacePopupTemplate
        });

        view.watch("zoom", function (newZoom) {
            if (newZoom >= 12) {
                restaurantFeatureLayer.renderer = restaurantRatingMarkRenderer;
                workingPlaceCSVLayer.renderer = workingPlaceMarkRenderer;
            } else {
                restaurantFeatureLayer.renderer = restaurantHeatmapRenderer;
                workingPlaceCSVLayer.renderer = workingPlaceHeatmapRenderer;
            }
        });

        view.when(function () {

            const layerList = new LayerList({
                view: view
            });

            const searchWidget = new Search({
                view: view,
                suggestionEnabled: true,
                activeSourceIndex: 1,
                sources: [
                    {
                        layer: restaurantFeatureLayer,
                        name: "ค้นหาร้านอาหาร จ.ขอนแก่น",
                        searchFields: ["name", "address"],
                        displayField: "name",
                        exactMatch: false,
                        outFields: ["*"],
                        placeholder: "🔍 ค้นหาร้านอาหาร จ.ขอนแก่น",
                        suggestionTemplate: "{name} - {address}"
                    },
                    {
                        layer: workingPlaceCSVLayer,
                        name: "ค้นหาสถานที่น่านั่งทำงาน จ.ขอนแก่น",
                        searchFields: ["place_name", "type"],
                        displayField: "place_name",
                        exactMatch: false,
                        outFields: ["*"],
                        placeholder: "🔍 ค้นหาสถานที่น่านั่งทำงาน จ.ขอนแก่น",
                        suggestionTemplate: "{place_name} - {type}"
                    }
                ]
            });

            const editor = new Editor({
                view: view
            });

            const sketchWidget = new Sketch({
                view: view,
                layer: sketchGraphicsLayer,
                creationMode: "update"
            });

            // Top-Left side
            view.ui.remove("zoom")
            view.ui.add(new Expand({ view: view, content: layerList }), "top-left");
            view.ui.add(new Expand({ view: view, content: editor, expandIconClass: "esri-icon-edit", expandTooltip: "Edit Features" }), "top-left");

            view.ui.add(sketchWidget, "bottom-left");

            // Top-Right side
            view.ui.add(searchWidget, "top-right");
            view.ui.add(new Home({ view: view }), "top-right");
            view.ui.add(new Expand({ view: view, content: new BasemapGallery({ view: view }) }), "top-right");
            view.ui.add(new Expand({ view: view, content: new Legend({ view: view }) }), "top-right");

            // ดัก event เมื่อวาด Polygon เสร็จ
            sketchWidget.on("create", function (event) {
                if (event.state === "complete") {
                    sketchGraphicsLayer.removeAll()
                    const polygonGraphic = event.graphic;
                    if (polygonGraphic) {
                        sketchGraphicsLayer.add(polygonGraphic)
                        applyFilterEffect(polygonGraphic.geometry);
                    }
                }
            });

            // ดัก event เมื่อมีการอัปเดต Polygon
            sketchWidget.on("update", function (event) {
                if (event.state === "complete") {
                    const updatedPolygonGraphic = event.graphics[0];
                    applyFilterEffect(updatedPolygonGraphic.geometry);
                }
            });

            // ดัก event เมื่อมีการลบ Polygon
            sketchWidget.on("delete", function (event) {
                const deletedPolygonGraphic = event.graphics[0];
                applyFilterEffect(null); // ลบ filter effect ถ้าไม่มี polygon
            });

            function applyFilterEffect(polygonGeometry) {
                if (polygonGeometry) {
                    // ใช้ geometryFilter กับ FeatureLayer และ CSVLayer
                    restaurantFeatureLayer.featureEffect = {
                        filter: { geometry: polygonGeometry },
                        includedEffect: "drop-shadow(3px, 3px, 3px, gray) brightness(1.2)",
                        excludedEffect: "opacity(30%)"
                    };

                    workingPlaceCSVLayer.featureEffect = {
                        filter: { geometry: polygonGeometry },
                        includedEffect: "drop-shadow(3px, 3px, 3px, gray) brightness(1.2)",
                        excludedEffect: "opacity(30%)"
                    };
                } else {
                    // ถ้าไม่มี polygon (กรณีลบ) ให้ลบ effect
                    restaurantFeatureLayer.featureEffect = null;
                    workingPlaceCSVLayer.featureEffect = null;
                }
            }
        }).catch(function (error) {
            console.error("Error initializing view: ", error);
        });

        map.layers.add(restaurantFeatureLayer)
        map.layers.add(workingPlaceCSVLayer)
    });