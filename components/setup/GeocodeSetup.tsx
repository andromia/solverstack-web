import React, { useState, useRef, useEffect } from "react";
import Papa from "papaparse";
import BubbleMap from "../maps/BubbleMap";
import WorldAtlasJson from "../maps/MapJson";
import * as mapTypes from "../maps/MapTypes";

// Bootstrap
import Accordion from "react-bootstrap/Accordion";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

const axios = require('axios');


const svgHeight: number = 350;

const GeocodeSetup = () => {
    /**
     * Setup page for geocode module. 
     * 
     * Requires users to input csv file containing
     * zipcodes and country abbreviations.
     */
    const atlasJson = WorldAtlasJson();
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const [svgWidth, setSvgWidth] = useState<any>(null);
    const [fileName, setFileName] = useState("zipcode file");
    const [csvUrl, setCsvUrl] = useState<string>("");
    const [destinations, setDestinations] = useState<Array<mapTypes.CoordinateMarker>>(Array<mapTypes.CoordinateMarker>(0));

    const handleSvgWidth = () => {
        /**
         * Get current width of div containing rendered SVG and 
         * set svg width state.
         */
        if (!svgContainerRef) {
            return;
        }
        
        if (svgContainerRef.current) {
            setSvgWidth(svgContainerRef.current.offsetWidth);
        }
    }

    const onFileUpdate = event => {
        /**
         * Event handler for file input.
         */
        setFileName(event.target.value.split("\\").splice(-1)[0]);

        Papa.parse(event.target.files[0], {
            header: true,
            complete: function(results) {
                axios.post(
                    process.env.dev.GEOCODE_SERVICE_URL,
                    {stack_id: 1, zipcodes: results.data} // NOTE: for MVP stack_id is hardcoded
                    ).then(function (response) {
                        
                        setDestinations(response.data.geocodes);

                        const csv = Papa.unparse(response.data.geocodes);
                        const csvData = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
                        const csvUrl = window.URL.createObjectURL(csvData);
            
                        setCsvUrl(csvUrl);
                    }).catch(function (error) {
                        console.log(error);
                        return error;
                    });
            }
        });
    };

    useEffect(() => {
        window.addEventListener("load", handleSvgWidth);
        window.addEventListener("resize", handleSvgWidth);
    }, []);


    return (
        <Accordion defaultActiveKey="1">
            <Card>
                <Accordion.Toggle as={Card.Header} eventKey="1">
                    <Row className="d-flex justify-content-end">
                        <Col>
                            <h4>Geocode</h4>
                        </Col>
                        <Accordion.Toggle as={Button} eventKey="1">
                            Toggle Collapse
                        </Accordion.Toggle>
                    </Row>
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="1">
                    <Card.Body>
                        <Form>
                            <Row className="mb-4">
                                <Col className="p-0">
                                    <div 
                                    className="svg-container"
                                    ref={svgContainerRef}>
                                        <BubbleMap 
                                        height={svgHeight}
                                        width={svgWidth}
                                        atlasJson={atlasJson}
                                        origins={[]}
                                        destinations={destinations} />
                                    </div>
                                </Col>
                            </Row>
                            <Row className="d-flex justify-content-end">
                                {destinations.length > 0 &&
                                    <a href={csvUrl}><Button className="download-btn">Download</Button></a>
                                }
                                <Col lg="8">
                                    <Form.File 
                                    id="custom-file" 
                                    label={fileName} 
                                    custom onChange={onFileUpdate} />
                                </Col>
                            </Row>
                        </Form>
                    </Card.Body>
                </Accordion.Collapse>
            </Card>
        </Accordion>
    );
};

export default GeocodeSetup;
