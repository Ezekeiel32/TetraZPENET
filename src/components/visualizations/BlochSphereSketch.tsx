
"use client";

import React, { useEffect, useRef } from 'react';
import type p5 from 'p5';

interface BlochSphereSketchProps {
  theta: number;
  phi: number;
  evolving: boolean;
  width?: number;
  height?: number;
}

const BlochSphereSketch: React.FC<BlochSphereSketchProps> = ({
  theta: initialTheta,
  phi: initialPhi,
  evolving: initialEvolving,
  width = 400,
  height = 400,
}) => {
  const sketchRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const timeRef = useRef(0); // To store time for animation across re-renders

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('p5').then(p5Module => {
        const P5 = p5Module.default;

        if (p5InstanceRef.current) {
          p5InstanceRef.current.remove(); // Cleanup previous instance
        }

        const sketch = (p: p5) => {
          let currentTheta = initialTheta;
          let currentPhi = initialPhi;
          let currentEvolving = initialEvolving;

          p.setup = () => {
            p.createCanvas(width, height, p.WEBGL);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
          };

          p.updateWithProps = (props: BlochSphereSketchProps) => {
            currentTheta = props.theta;
            // Only update phi from prop if not evolving, otherwise let time drive it
            if (!props.evolving) {
                currentPhi = props.phi;
            }
            currentEvolving = props.evolving;
          };
          p.updateWithProps({ theta: initialTheta, phi: initialPhi, evolving: initialEvolving, width, height });


          p.draw = () => {
            p.background(255);
            p.orbitControl();

            if (currentEvolving) {
              currentPhi = initialPhi + timeRef.current; // Use initialPhi from props as base for evolution
              timeRef.current += 0.02;
            } else {
              // If not evolving, phi should be static based on slider (already set by updateWithProps)
              // currentPhi = currentPhi; // No change if not evolving and slider hasn't moved
            }
            
            // Draw Bloch sphere (wireframe)
            p.push();
            p.noFill();
            p.stroke(200);
            p.sphere(100, 16, 12);
            p.pop();

            // Draw axes (σ_x, σ_y, σ_z)
            p.strokeWeight(2);
            // X-axis (red)
            p.stroke(255, 0, 0);
            p.line(-120, 0, 0, 120, 0, 0);
            // Y-axis (green)
            p.stroke(0, 255, 0);
            p.line(0, -120, 0, 0, 120, 0);
            // Z-axis (blue)
            p.stroke(0, 0, 255);
            p.line(0, 0, -120, 0, 0, 120);

            // Label axes
            p.push();
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.translate(130, 5, 0); p.text("σ_x", 0, 0); p.pop(); // Adjusted y for better centering
            p.push();
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.translate(0, 130, 0); p.text("σ_y", 0, 0); p.pop();
            p.push();
            p.fill(0);
            p.noStroke();
            p.textSize(12);
            p.translate(0, 5, 130); p.text("σ_z", 0, 0); p.pop(); // Adjusted y for better centering


            // Calculate Bloch vector components
            const x = Math.sin(currentTheta) * Math.cos(currentPhi);
            const y = Math.sin(currentTheta) * Math.sin(currentPhi);
            const z = Math.cos(currentTheta);

            // Draw state vector
            p.push();
            p.stroke(0, 0, 255);
            p.strokeWeight(3);
            p.line(0, 0, 0, x * 100, y * 100, z * 100);
            p.fill(0, 0, 255);
            p.translate(x * 100, y * 100, z * 100);
            p.sphere(5);
            p.pop();

            // Display state info (2D overlay) - Requires careful camera setup
            // For simplicity, this part is omitted in the React component as it's complex
            // to overlay p5 2D text on a WEBGL canvas perfectly without extra graphics layers.
            // The parent React component can display this text.
          };

          // Expose a method to update props for the sketch
          (p as any).customProps = (newProps: BlochSphereSketchProps) => {
            currentTheta = newProps.theta;
             if (!newProps.evolving) {
                currentPhi = newProps.phi;
            } else {
                // if evolving starts, phi will be driven by timeRef.current,
                // but we might want to "reset" the phi start point to the current slider value
                initialPhi = newProps.phi; // Update the base phi for evolution if it just started
            }
            currentEvolving = newProps.evolving;
          };
        };

        p5InstanceRef.current = new P5(sketch, sketchRef.current!);
      });
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, [width, height]); // Re-create sketch if width/height changes

  // Effect to update sketch when props change
   useEffect(() => {
    if (p5InstanceRef.current && (p5InstanceRef.current as any).customProps) {
      (p5InstanceRef.current as any).customProps({ theta: initialTheta, phi: initialPhi, evolving: initialEvolving, width, height });
    }
    // If evolution stops, ensure phi is set to the slider value
    if (!initialEvolving && p5InstanceRef.current && (p5InstanceRef.current as any).customProps) {
       timeRef.current = 0; // Reset time if evolution stops, orphi might jump
    }
  }, [initialTheta, initialPhi, initialEvolving, width, height]);


  return <div ref={sketchRef} className="rounded-md border shadow-lg" />;
};

export default BlochSphereSketch;
