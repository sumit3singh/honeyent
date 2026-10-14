import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

interface Scene3DProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function Scene3D({ containerRef }: Scene3DProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        // Detect mobile/small screens
        const width = containerRef.current.clientWidth;
        const isMobileScreen = width < 768;
        setIsMobile(isMobileScreen);

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.Fog(0x0f172a, 80, 500);

        // Camera - adjusted for mobile
        const camera = new THREE.PerspectiveCamera(
            isMobileScreen ? 60 : 75,
            width / containerRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(0, 3, isMobileScreen ? 8 : 15);
        camera.lookAt(0, 1.5, 0);

        // Renderer - optimized for mobile
        const renderer = new THREE.WebGLRenderer({
            antialias: !isMobileScreen,
            alpha: true,
            powerPreference: "low-power"
        });
        renderer.setSize(width, containerRef.current.clientHeight);

        // Optimize pixel ratio for mobile
        const pixelRatio = isMobileScreen ? 1 : Math.min(window.devicePixelRatio, 2);
        renderer.setPixelRatio(pixelRatio);

        renderer.shadowMap.enabled = !isMobileScreen; // Disable shadows on mobile
        if (renderer.shadowMap.enabled) {
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }
        containerRef.current.appendChild(renderer.domElement);

        // Lighting - reduced quality on mobile
        const ambientLight = new THREE.AmbientLight(0xffffff, isMobileScreen ? 0.8 : 0.6);
        scene.add(ambientLight);

        if (!isMobileScreen) {
            // Main directional light (only on desktop)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(15, 20, 10);
            directionalLight.castShadow = true;
            directionalLight.shadow.camera.left = -30;
            directionalLight.shadow.camera.right = 30;
            directionalLight.shadow.camera.top = 30;
            directionalLight.shadow.camera.bottom = -30;
            directionalLight.shadow.mapSize.width = 1024; // Reduced from 2048
            directionalLight.shadow.mapSize.height = 1024;
            scene.add(directionalLight);
        }

        // Point lights - fewer on mobile
        const pointLight1 = new THREE.PointLight(0xff9800, isMobileScreen ? 0.4 : 0.8, 40);
        pointLight1.position.set(8, 6, 8);
        scene.add(pointLight1);

        if (!isMobileScreen) {
            const pointLight2 = new THREE.PointLight(0x00bfff, 0.6, 50);
            pointLight2.position.set(-10, 8, -10);
            scene.add(pointLight2);
        }

        // Create truck (simplified for mobile)
        function createTruck() {
            const group = new THREE.Group();

            if (isMobileScreen) {
                // Mobile: Use simple boxes without details
                const cabinGeometry = new THREE.BoxGeometry(1.5, 2, 2);
                const cabinMaterial = new THREE.MeshStandardMaterial({
                    color: 0xff6b35,
                    flatShading: true
                });
                const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
                cabin.position.set(0, 1, 0);
                cabin.castShadow = false;
                cabin.receiveShadow = false;
                group.add(cabin);

                const trailerGeometry = new THREE.BoxGeometry(2, 1.5, 3.5);
                const trailerMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffa500,
                    flatShading: true
                });
                const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
                trailer.position.set(0, 1, 3);
                trailer.castShadow = false;
                trailer.receiveShadow = false;
                group.add(trailer);

                // Fewer wheels on mobile
                const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8);
                const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

                const wheels = [
                    new THREE.Vector3(-1, 0.5, 1),
                    new THREE.Vector3(1, 0.5, 1),
                    new THREE.Vector3(-1, 0.5, 3),
                    new THREE.Vector3(1, 0.5, 3),
                ];

                wheels.forEach((position) => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.copy(position);
                    wheel.castShadow = false;
                    wheel.receiveShadow = false;
                    group.add(wheel);
                });
            } else {
                // Desktop: Original detailed version
                const cabinGeometry = new THREE.BoxGeometry(2, 2.5, 3);
                const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xff6b35 });
                const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
                cabin.position.set(0, 1.5, 0);
                cabin.castShadow = true;
                cabin.receiveShadow = true;
                group.add(cabin);

                const trailerGeometry = new THREE.BoxGeometry(3, 2, 5);
                const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
                const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
                trailer.position.set(0, 1.5, 5);
                trailer.castShadow = true;
                trailer.receiveShadow = true;
                group.add(trailer);

                const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.6, 16);
                const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

                const wheels = [
                    new THREE.Vector3(-1.5, 0.8, 1),
                    new THREE.Vector3(1.5, 0.8, 1),
                    new THREE.Vector3(-1.5, 0.8, -1),
                    new THREE.Vector3(1.5, 0.8, -1),
                    new THREE.Vector3(-1.5, 0.8, 4),
                    new THREE.Vector3(1.5, 0.8, 4),
                ];

                wheels.forEach((position) => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.copy(position);
                    wheel.castShadow = true;
                    wheel.receiveShadow = true;
                    group.add(wheel);
                });
            }

            group.position.set(isMobileScreen ? -4 : -8, 0, 0);
            return group;
        }

        // Create JCB (simplified for mobile)
        function createJCB() {
            const group = new THREE.Group();

            if (isMobileScreen) {
                const bodyGeometry = new THREE.BoxGeometry(1.5, 1.5, 2);
                const bodyMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffcc00,
                    flatShading: true
                });
                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.position.set(0, 1, 0);
                body.castShadow = false;
                body.receiveShadow = false;
                group.add(body);

                const boomGeometry = new THREE.BoxGeometry(0.3, 0.3, 2);
                const boomMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa00 });
                const boom = new THREE.Mesh(boomGeometry, boomMaterial);
                boom.position.set(0, 1.8, 1);
                boom.rotation.z = Math.PI / 6;
                boom.castShadow = false;
                boom.receiveShadow = false;
                group.add(boom);

                // Fewer wheels on mobile
                const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 8);
                const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

                const wheels = [
                    new THREE.Vector3(-0.8, 0.4, 0.5),
                    new THREE.Vector3(0.8, 0.4, 0.5),
                    new THREE.Vector3(-0.8, 0.4, -0.5),
                    new THREE.Vector3(0.8, 0.4, -0.5),
                ];

                wheels.forEach((position) => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.copy(position);
                    wheel.castShadow = false;
                    wheel.receiveShadow = false;
                    group.add(wheel);
                });
            } else {
                // Desktop version
                const bodyGeometry = new THREE.BoxGeometry(2.5, 2, 3);
                const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc00 });
                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.position.set(0, 1.2, 0);
                body.castShadow = true;
                body.receiveShadow = true;
                group.add(body);

                const boomGeometry = new THREE.BoxGeometry(0.5, 0.5, 3);
                const boomMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa00 });
                const boom = new THREE.Mesh(boomGeometry, boomMaterial);
                boom.position.set(0, 2.5, 1.5);
                boom.rotation.z = Math.PI / 6;
                boom.castShadow = true;
                boom.receiveShadow = true;
                group.add(boom);

                const bucketGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
                const bucketMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const bucket = new THREE.Mesh(bucketGeometry, bucketMaterial);
                bucket.position.set(0, 3.5, 3);
                bucket.castShadow = true;
                bucket.receiveShadow = true;
                group.add(bucket);

                const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
                const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });

                const wheels = [
                    new THREE.Vector3(-1.2, 0.6, 0.8),
                    new THREE.Vector3(1.2, 0.6, 0.8),
                    new THREE.Vector3(-1.2, 0.6, -0.8),
                    new THREE.Vector3(1.2, 0.6, -0.8),
                ];

                wheels.forEach((position) => {
                    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                    wheel.rotation.z = Math.PI / 2;
                    wheel.position.copy(position);
                    wheel.castShadow = true;
                    wheel.receiveShadow = true;
                    group.add(wheel);
                });
            }

            group.position.set(isMobileScreen ? 4 : 8, 0, 0);
            return group;
        }

        // Create Stone Crusher (simplified for mobile)
        function createCrusher() {
            const group = new THREE.Group();

            if (isMobileScreen) {
                const hopperGeometry = new THREE.ConeGeometry(1.5, 1.2, 6);
                const hopperMaterial = new THREE.MeshStandardMaterial({
                    color: 0xcc3300,
                    flatShading: true
                });
                const hopper = new THREE.Mesh(hopperGeometry, hopperMaterial);
                hopper.position.set(0, 1.2, 0);
                hopper.castShadow = false;
                hopper.receiveShadow = false;
                group.add(hopper);

                const chamberGeometry = new THREE.CylinderGeometry(1, 0.8, 1.5, 6);
                const chamberMaterial = new THREE.MeshStandardMaterial({
                    color: 0x990000,
                    flatShading: true
                });
                const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
                chamber.position.set(0, 0, 0);
                chamber.castShadow = false;
                chamber.receiveShadow = false;
                group.add(chamber);
            } else {
                // Desktop version
                const hopperGeometry = new THREE.ConeGeometry(2.5, 2, 8);
                const hopperMaterial = new THREE.MeshStandardMaterial({ color: 0xcc3300 });
                const hopper = new THREE.Mesh(hopperGeometry, hopperMaterial);
                hopper.position.set(0, 2, 0);
                hopper.castShadow = true;
                hopper.receiveShadow = true;
                group.add(hopper);

                const chamberGeometry = new THREE.CylinderGeometry(1.8, 1.5, 3, 8);
                const chamberMaterial = new THREE.MeshStandardMaterial({ color: 0x990000 });
                const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
                chamber.position.set(0, 0, 0);
                chamber.castShadow = true;
                chamber.receiveShadow = true;
                group.add(chamber);

                const conveyorGeometry = new THREE.BoxGeometry(2, 0.8, 4);
                const conveyorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
                const conveyor = new THREE.Mesh(conveyorGeometry, conveyorMaterial);
                conveyor.position.set(0, -1.5, 2);
                conveyor.rotation.z = -Math.PI / 8;
                conveyor.castShadow = true;
                conveyor.receiveShadow = true;
                group.add(conveyor);
            }

            group.position.set(0, 0, isMobileScreen ? -5 : -10);
            return group;
        }

        // Create ground/platform
        const groundGeometry = new THREE.PlaneGeometry(isMobileScreen ? 20 : 40, isMobileScreen ? 20 : 40);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.8,
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = !isMobileScreen;
        scene.add(ground);

        // Add vehicles
        const truck = createTruck();
        const jcb = createJCB();
        const crusher = createCrusher();

        scene.add(truck);
        scene.add(jcb);
        scene.add(crusher);

        // Animation - reduced motion on mobile
        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);

            // Slower rotation on mobile
            const rotationSpeed = isMobileScreen ? 0.0002 : 0.0005;

            truck.rotation.y += rotationSpeed;
            jcb.rotation.y -= rotationSpeed * 0.6;
            crusher.rotation.y += rotationSpeed * 0.4;

            // Reduced bobbing on mobile
            const bobScale = isMobileScreen ? 0.1 : 0.2;
            truck.position.y = Math.sin(Date.now() * 0.001) * bobScale;
            jcb.position.y = Math.sin(Date.now() * 0.001 + Math.PI / 3) * bobScale;
            crusher.position.y = Math.sin(Date.now() * 0.001 + (2 * Math.PI) / 3) * bobScale;

            renderer.render(scene, camera);
        };

        animate();

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            camera.aspect = newWidth / newHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(newWidth, newHeight);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup
        return () => {
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(animationId);
            renderer.dispose();
            containerRef.current?.removeChild(renderer.domElement);
        };
    }, [containerRef]);

    return null;
}
