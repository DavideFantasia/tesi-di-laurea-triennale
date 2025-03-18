#pragma once

#include <GL/glew.h>
#include <glm/glm.hpp>

#include "../rendering/Shader.h"
#include "../core/InputManager.h"

#include <imgui.h>
#include <backends/imgui_impl_glfw.h>
#include <backends/imgui_impl_opengl3.h>

class Fractal {
public:
    virtual ~Fractal() = default;

    // Metodo per aggiornare i parametri dei frattali
    virtual void updateParameters(InputManager inputManager) = 0;

    // Metodo per impostare le uniform
    virtual void setUniform() = 0;

    // Metodo per disegnare i controlli GUI specifici del singolo frattale
    virtual void renderGUI() = 0;

    // Restituisce lo shader program associato
    virtual GLuint getShaderProgram() const = 0;

    virtual void reset_param() = 0;
};