#pragma once

#include "Fractal.h"

class MandelBulb : public Fractal {
public:
    MandelBulb() {
        shader.create_program("fractals/quad.vert", "fractals/fragment/mandelbulb.frag");
        name = "Mandelbulb";
        animationStartTime = 0.0f;
        is_3D = true;
    }

    void updateParameters(InputManager inputManager) override {
        camPos = inputManager.camera.Position;
        view = inputManager.camera.GetViewMatrix();
        proj = glm::perspective(glm::radians(inputManager.camera.Zoom), 1080.f / 1920.f, 0.25f, 10.f);
    }

    void setUniform() override {
        shader.use();
        float elapsedTime = ImGui::GetTime() - animationStartTime;
        glUniform1f(glGetUniformLocation(shader.program, "uTime"), elapsedTime);
        
        glUniformMatrix4fv(glGetUniformLocation(shader.program, "uProj"), 1, GL_FALSE, &proj[0][0]);
        glUniformMatrix4fv(glGetUniformLocation(shader.program, "uView"), 1, GL_FALSE, &view[0][0]);
    }

    void renderGUI() override {
        ;
    }

    GLuint getShaderProgram() const override {
        return shader.program;
    }

    void reset_param() override {
        animationStartTime = ImGui::GetTime();
    }

private:
    Shader shader;
    glm::vec2 center = glm::vec2(-0.5f, 0.2f);
    float zoom = 1.0f;
    float animationStartTime;  // Tempo di inizio animazione
    //glm::vec2 mouse;
    glm::mat4 proj, view;
    glm::vec3 camPos;
};
