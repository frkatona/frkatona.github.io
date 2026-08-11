import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def parse_arguments():
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description="Render portfolio model thumbnails.")
    parser.add_argument("--project-directory", type=Path, default=Path(__file__).resolve().parent)
    parser.add_argument("--ids", nargs="*", default=[], help="Render only these model IDs.")
    return parser.parse_args(arguments)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.armatures,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.actions,
    ):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def configure_scene(scene):
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 480
    scene.render.resolution_y = 270
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.image_settings.quality = 78
    scene.render.film_transparent = True
    scene.render.use_file_extension = True
    scene.render.image_settings.color_depth = "8"

    world = bpy.data.worlds.new("Thumbnail World")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.035, 0.055, 0.085, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.42
    scene.world = world

    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except TypeError:
        pass


def apply_external_albedo(model_entry, project_directory, mesh_objects):
    albedo_path = model_entry.get("albedo")
    if not albedo_path:
        return

    image = bpy.data.images.load(str(project_directory / albedo_path), check_existing=True)
    image.colorspace_settings.name = "sRGB"
    for mesh in mesh_objects:
        if not mesh.material_slots:
            mesh.data.materials.append(bpy.data.materials.new(name=f"{mesh.name} Thumbnail Material"))
        for slot in mesh.material_slots:
            material = slot.material
            if material is None:
                material = bpy.data.materials.new(name=f"{mesh.name} Thumbnail Material")
                slot.material = material
            material.use_nodes = True
            nodes = material.node_tree.nodes
            links = material.node_tree.links
            shader = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
            if shader is None:
                continue
            texture = nodes.new("ShaderNodeTexImage")
            texture.image = image
            texture.interpolation = "Closest"
            texture.extension = "EXTEND"
            if mesh.data.uv_layers:
                uv_map = nodes.new("ShaderNodeUVMap")
                uv_map.uv_map = mesh.data.uv_layers[0].name
                links.new(uv_map.outputs["UV"], texture.inputs["Vector"])
            base_color = shader.inputs.get("Base Color")
            if base_color is not None:
                for link in list(base_color.links):
                    links.remove(link)
                links.new(texture.outputs["Color"], base_color)
            if "Alpha" in shader.inputs:
                for link in list(shader.inputs["Alpha"].links):
                    links.remove(link)
                links.new(texture.outputs["Alpha"], shader.inputs["Alpha"])
            if "Metallic" in shader.inputs:
                shader.inputs["Metallic"].default_value = 0
            if "Roughness" in shader.inputs:
                shader.inputs["Roughness"].default_value = 0.78


def model_bounds(mesh_objects):
    points = []
    dependency_graph = bpy.context.evaluated_depsgraph_get()
    for mesh in mesh_objects:
        evaluated = mesh.evaluated_get(dependency_graph)
        points.extend(evaluated.matrix_world @ Vector(corner) for corner in evaluated.bound_box)
    if not points:
        raise RuntimeError("The imported file contains no renderable mesh bounds.")
    minimum = Vector(tuple(min(point[index] for point in points) for index in range(3)))
    maximum = Vector(tuple(max(point[index] for point in points) for index in range(3)))
    return points, minimum, maximum


def point_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area_light(name, color, energy, size, location, target):
    light_data = bpy.data.lights.new(name=name, type="AREA")
    light_data.color = color
    light_data.energy = energy
    light_data.shape = "DISK"
    light_data.size = size
    light = bpy.data.objects.new(name, light_data)
    bpy.context.scene.collection.objects.link(light)
    light.location = location
    point_at(light, target)


def frame_model(scene, points, minimum, maximum, model_id):
    size = maximum - minimum
    center = (minimum + maximum) * 0.5
    radius = max(size.length * 0.5, 0.01)
    target = Vector((center.x, center.y, minimum.z + size.z * 0.48))

    camera_data = bpy.data.cameras.new("Thumbnail Camera")
    camera_data.type = "ORTHO"
    camera = bpy.data.objects.new("Thumbnail Camera", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera

    view_directions = {
        "boat": (0.25, -1.25, 0.48),
        "cannon": (1.18, -0.72, 0.46),
        "coffee-cup": (0.88, -1.10, 0.62),
    }
    view_direction = Vector(view_directions.get(model_id, (0.72, -1.18, 0.38))).normalized()
    camera.location = target + view_direction
    point_at(camera, target)
    camera_rotation_inverse = camera.rotation_euler.to_matrix().transposed()
    camera_points = [camera_rotation_inverse @ (point - target) for point in points]
    projected_width = max(point.x for point in camera_points) - min(point.x for point in camera_points)
    projected_height = max(point.y for point in camera_points) - min(point.y for point in camera_points)
    zoom_overrides = {"crossbow": 4.25}
    zoom = zoom_overrides.get(model_id, 1)
    aspect_ratio = scene.render.resolution_x / scene.render.resolution_y
    camera_data.ortho_scale = max(projected_width, projected_height * aspect_ratio, 0.01) * 1.12 / zoom
    distance = max(radius * 3.5, 1)
    camera.location = target + view_direction * distance
    camera_data.clip_start = max(distance / 1000, 0.001)
    camera_data.clip_end = max(distance * 20, 100)
    point_at(camera, target)

    energy_scale = max(radius, 0.35) ** 2
    add_area_light(
        "Key Light",
        (1.0, 0.76, 0.58),
        820 * energy_scale,
        max(radius * 1.3, 0.5),
        target + Vector((-1.5, -1.8, 2.2)).normalized() * radius * 3.2,
        target,
    )
    add_area_light(
        "Fill Light",
        (0.34, 0.74, 1.0),
        520 * energy_scale,
        max(radius * 1.6, 0.5),
        target + Vector((2.1, -0.5, 0.8)).normalized() * radius * 3.0,
        target,
    )
    add_area_light(
        "Rim Light",
        (0.55, 0.84, 1.0),
        680 * energy_scale,
        max(radius, 0.4),
        target + Vector((-0.5, 1.8, 1.5)).normalized() * radius * 3.0,
        target,
    )


def render_thumbnail(scene, model_entry, project_directory, output_directory):
    clear_scene()
    configure_scene(scene)
    source = project_directory / model_entry["src"]
    bpy.ops.import_scene.gltf(filepath=str(source))
    scene.frame_set(int(scene.frame_start))

    mesh_objects = [obj for obj in scene.objects if obj.type == "MESH" and not obj.hide_render]
    apply_external_albedo(model_entry, project_directory, mesh_objects)
    points, minimum, maximum = model_bounds(mesh_objects)
    frame_model(scene, points, minimum, maximum, model_entry["id"])
    destination = output_directory / f"{model_entry['id']}.webp"
    scene.render.filepath = str(destination)
    bpy.ops.render.render(write_still=True)
    size = maximum - minimum
    print(f"Rendered {model_entry['name']} ({size.x:.3f} x {size.y:.3f} x {size.z:.3f}) -> {destination.name}")


def main():
    arguments = parse_arguments()
    project_directory = arguments.project_directory.resolve()
    manifest = json.loads((project_directory / "assets" / "models.json").read_text(encoding="utf-8"))
    requested_ids = set(arguments.ids)
    models = [model for model in manifest["models"] if not requested_ids or model["id"] in requested_ids]
    missing_ids = requested_ids - {model["id"] for model in models}
    if missing_ids:
        raise ValueError(f"Unknown model IDs: {', '.join(sorted(missing_ids))}")
    output_directory = project_directory / "assets" / "thumbnails"
    output_directory.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    for model_entry in models:
        render_thumbnail(scene, model_entry, project_directory, output_directory)
    print(f"Rendered {len(models)} model thumbnails.")


if __name__ == "__main__":
    main()
