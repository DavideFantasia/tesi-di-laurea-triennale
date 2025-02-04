#define GLM_ENABLE_EXPERIMENTAL
#define FILE_POSITION __LINE__,__FILE__

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <string>
#include <iostream>

#include <glm/ext.hpp>  
#include <glm/gtx/string_cast.hpp>
#include <cmath>
#include <algorithm>

#include "core/Debugging.h"
#include "core/Window.h"
#include "core/GUIManager.h"
#include "core/InputManager.h"

#include "rendering/Shader.h"
#include "rendering/FrameBuffer.h"
#include "rendering/Renderer.h"

int main(void)
{
    Window window(1920, 1080, "Renderer di Frattali");

    // Initialize the library and the window
    if (!window.init())
        return -1;

    GUIManager::init(window.getGLFWwindow());
    InputManager inputManager(window.getGLFWwindow());
    
    //se è impostata la modalità 3D si setta di conseguenza la modalità di input
    GUIManager::is_3d_enabled() ? 
            inputManager.setMode(InputManager::Mode::MODE_3D) 
            : inputManager.setMode(InputManager::Mode::MODE_2D);

    printout_opengl_glsl_info();

    FrameBuffer framebuffer;
    framebuffer.init(window.getWidth(), window.getHeight());

    check_gl_errors(FILE_POSITION,false);

    Renderer quad_render;
    quad_render.init("fractals/quad.vert", "fractals/quad.frag");
    quad_render.setupQuad();

    check_gl_errors(FILE_POSITION, false);

    //shader specifica di calcolo del frattale
    Shader fractals_shaders[3];
    fractals_shaders[0].create_program("fractals/quad.vert", "fractals/fragment/mandelbrot.frag");
    fractals_shaders[1].create_program("fractals/quad.vert", "fractals/fragment/julia.frag");
    fractals_shaders[2].create_program("fractals/quad.vert", "fractals/fragment/sierpinski.frag");


    for(int i=0; i< 3; i++)
        printActiveUniforms(fractals_shaders[i].program);
    check_gl_errors(FILE_POSITION, false);

    // Variabili per il frattale
    glm::vec2 center = glm::vec2(-0.5f, 0.2f);

    glDisable(GL_DEPTH_TEST);

    int currentFrame = 0;
    // Loop until the user closes the window  
    while (!window.shouldClose()){
        currentFrame++;
        // Render here  
        framebuffer.bind();

        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        
        Shader selected_shader = fractals_shaders[GUIManager::get_selected_fractal()];
        selected_shader.use();

        glUniform2fv(selected_shader["uResolution"], 1, &glm::vec2(framebuffer.getWidth(), framebuffer.getHeight())[0]);

        center.x -= inputManager.getPanningX();
        center.y += inputManager.getPanningY();

        glUniform2fv(selected_shader["uCenter"], 1, &center[0]);
        glUniform1f(glGetUniformLocation(selected_shader.program, "uZoom"), inputManager.getZoom2D());
        glUniform1i(glGetUniformLocation(selected_shader.program, "uFrame"), currentFrame);
        glUniform1f(glGetUniformLocation(selected_shader.program, "uTime"), (float)ImGui::GetTime());
        // Renderizza il quad per calcolare il frattale
        glBindVertexArray(quad_render.quadVAO); // Usa direttamente il VAO
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glBindVertexArray(0);

        framebuffer.unbind(window.getWidth(), window.getHeight());

        //Render del contenuto del framebuffer a schermo
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        quad_render.renderQuad(framebuffer.getTexture());

        //render GUI
        GUIManager::render(inputManager.getZoom2D());
        inputManager.update();

        window.swapBuffers();
        window.pollEvents();
    }

    GUIManager::cleanUp();
    quad_render.cleanUp();
    framebuffer.cleanUp();
    delete &window;
    glUseProgram(0);

    return 0;
}