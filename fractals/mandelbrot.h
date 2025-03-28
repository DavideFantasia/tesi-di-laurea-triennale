#pragma once

#include "Fractal.h"

class Mandelbrot : public Fractal {
public:
    Mandelbrot(){
        shader.create_program("fractals/quad.vert", "fractals/fragment/mandelbrot.frag");
        shader_double.create_program("fractals/quad.vert", "fractals/fragment/double_mandelbrot.frag");
        name = "Mandelbrot";
    }

    void updateParameters(InputManager inputManager) override {
        zoom = inputManager.getZoom2D();
        center.x -= inputManager.getPanningX();
        center.y += inputManager.getPanningY();
    }

    void setUniform() override {
        if (wants_double) {
            shader_double.use();
            glUniform1d(glGetUniformLocation(shader.program, "uZoom"), zoom);
        }
        else {
            shader.use();
            glUniform1f(glGetUniformLocation(shader.program, "uZoom"), float(zoom));
        }
        glUniform2fv(glGetUniformLocation(shader.program, "uCenter"), 1, &center[0]);
    }

    void renderGUI() override {
        if (ImGui::Checkbox("double precision", &wants_double)) {
            std::cout << "%b" << wants_double;
        }        

        if(wants_double) ImGui::Text("Zoom Value: %.12f", zoom);
    }

    GLuint getShaderProgram() const override {
        if(wants_double)
            return shader_double.program;
        return shader.program;
    }

    void reset_param() override {
        center = glm::vec2(-0.5f, 0.2f);
        zoom = 1.5f;
        InputManager::getInstance()->setZoom2D(zoom);
    }

private:
    Shader shader, shader_double;
    bool wants_double = false;
    glm::vec2 center = glm::vec2(-0.5f, 0.2f);
    double zoom = 1.0f;
};
