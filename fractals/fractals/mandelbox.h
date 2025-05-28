#pragma once

#include "Fractal.h"


class MandelBox : public Fractal {
public:
    MandelBox() {
        shader.create_program("fractals/quad.vert", "fractals/fragment/mandelbox.frag");
        name = "MandelBox";
        is_3D = true;
    }

    void updateParameters(InputManager inputManager) override {
        camPos = inputManager.camera.Position;
        view = inputManager.camera.GetViewMatrix();
        zoom = (float)inputManager.getZoom();
    }

    void setUniform() override {
        shader.use();

        glUniform1f(glGetUniformLocation(shader.program, "uZoom"), zoom);
        glUniformMatrix4fv(glGetUniformLocation(shader.program, "uView"), 1, GL_FALSE, &view[0][0]);
        glUniform3fv(glGetUniformLocation(shader.program, "uCamPos"), 1, &camPos[0]);
    }

    void renderGUI() override {
        ;
    }

    GLuint getShaderProgram() const override {
        return shader.program;
    }

    void reset_param() override {
        InputManager::getInstance()->camera.resetParameters();
    }

private:
    Shader shader;
    glm::vec2 center = glm::vec2(0.0f, 0.0f);
    float zoom = 1.0f;
    
    glm::mat4 view;
    glm::vec3 camPos;
};