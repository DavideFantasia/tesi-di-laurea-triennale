#define GLM_ENABLE_EXPERIMENTAL
#define FILE_POSITION __LINE__,__FILE__

#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <string>
#include <iostream>

#include <imgui.h>
#include <backends/imgui_impl_glfw.h>
#include <backends/imgui_impl_opengl3.h>

#include <glm/ext.hpp>  
#include <glm/gtx/string_cast.hpp>
#include <cmath>
#include <algorithm>

#include "core/Debugging.h"
#include "core/Window.h"
#include "rendering/Shader.h"
#include "rendering/FrameBuffer.h"
#include "rendering/Renderer.h"

int selected_fractal = 0;
static bool is_3d = false;

float zoom = 1.0f;
float test_time;

void gui_setup() {
    ImGui::BeginMainMenuBar();

    // Mostra gli FPS
    ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);

    // Menù a tendina per la scelta dei frattali disponibili
    if (ImGui::BeginMenu("Fractal's List")){
        if (ImGui::Selectable("Mandelbrot", selected_fractal == 0)) selected_fractal = 0;
        if (ImGui::Selectable("Serpinski's Triangle", selected_fractal == 1)) selected_fractal = 1;
        if (ImGui::Selectable("Julia's Set", selected_fractal == 2)) selected_fractal = 2;
        ImGui::EndMenu();
    }

    ImGui::Checkbox("3D", &is_3d);

    ImGui::SliderFloat("Zoom", &zoom, 1.f, 0.f,"%.5f");

    ImGui::EndMainMenuBar();
}

int main(void)
{
    Window window(1920, 1080, "Renderer di Frattali");

    // Initialize the library and the window
    if (!window.init())
        return -1;

    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO();
    ImGui_ImplOpenGL3_Init();
    ImGui_ImplGlfw_InitForOpenGL(window.getGLFWwindow(), true);

    printout_opengl_glsl_info();

    FrameBuffer framebuffer;
    framebuffer.init(window.getWidth(), window.getHeight());

    check_gl_errors(FILE_POSITION,false);

    Renderer quad_render;
    quad_render.init("fractals/quad.vert", "fractals/quad.frag");
    quad_render.setupQuad();

    check_gl_errors(FILE_POSITION, false);

    //shader specifica di calcolo del frattale
    Shader fractal_shader;
    fractal_shader.create_program("fractals/quad.vert", "fractals/fragment/mandelbrot.frag");
    
    printActiveUniforms(fractal_shader.program);
    check_gl_errors(FILE_POSITION, false);

    // Variabili per il frattale
    glm::vec2 center = glm::vec2(-0.75f, 0.25f);
  
    glDisable(GL_DEPTH_TEST);

    int currentFrame = 0;
    // Loop until the user closes the window  
    while (!window.shouldClose()){
        currentFrame++;
        // Render here  
        framebuffer.bind();

        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

        fractal_shader.use();
        
        glUniform2fv(fractal_shader["uResolution"], 1, &glm::vec2(framebuffer.getWidth(), framebuffer.getHeight() )[0]);

        glUniform2fv(fractal_shader["uCenter"], 1, &center[0]);
        glUniform1f(glGetUniformLocation(fractal_shader.program,"uZoom"), zoom);
        glUniform1i(glGetUniformLocation(fractal_shader.program, "uFrame"), currentFrame);
        
        
        // Renderizza il quad per calcolare il frattale
        glBindVertexArray(quad_render.quadVAO); // Usa direttamente il VAO
        glDrawArrays(GL_TRIANGLES, 0, 6);
        glBindVertexArray(0);

        framebuffer.unbind(window.getWidth(), window.getHeight());

        //Render del contenuto del framebuffer a schermo
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        quad_render.renderQuad(framebuffer.getTexture());

        //render GUI
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();
        gui_setup();


        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());


        window.swapBuffers();
        window.pollEvents();
    }
    quad_render.cleanUp();
    framebuffer.cleanUp();
    delete &window;
    glUseProgram(0);

    return 0;
}