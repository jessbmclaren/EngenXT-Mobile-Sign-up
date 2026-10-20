// Widens a studio photo by continuing its plain backdrop, so a tall portrait fits a wide hero.
// usage: swift extend.swift in.jpg out.jpg cropHeight newWidth offsetX
import Foundation
import CoreImage

let a = CommandLine.arguments
guard let src = CIImage(contentsOf: URL(fileURLWithPath: a[1])) else { fatalError("cannot read") }
let ch = CGFloat(Double(a[3])!), nw = CGFloat(Double(a[4])!), ox = CGFloat(Double(a[5])!)
// keep the top of the portrait (head to waist); Core Image's origin is bottom-left
let top = src.cropped(to: CGRect(x: 0, y: src.extent.height - ch, width: src.extent.width, height: ch))
    .transformed(by: CGAffineTransform(translationX: 0, y: -(src.extent.height - ch)))
let w = top.extent.width
// the backdrop beyond the photo: its edge pixels carried outwards, then softened so no streaks show
let edge = top.clampedToExtent().applyingGaussianBlur(sigma: 40)
let placed = top.transformed(by: CGAffineTransform(translationX: ox, y: 0))
let back = edge.transformed(by: CGAffineTransform(translationX: ox, y: 0)).cropped(to: CGRect(x: 0, y: 0, width: nw, height: ch))
// feather the seam where the real photo meets the extension
let mask = CIFilter(name: "CILinearGradient", parameters: [
    "inputPoint0": CIVector(x: ox, y: 0), "inputPoint1": CIVector(x: ox + 120, y: 0),
    "inputColor0": CIColor(red: 0, green: 0, blue: 0), "inputColor1": CIColor(red: 1, green: 1, blue: 1)])!.outputImage!
let mask2 = CIFilter(name: "CILinearGradient", parameters: [
    "inputPoint0": CIVector(x: ox + w, y: 0), "inputPoint1": CIVector(x: ox + w - 120, y: 0),
    "inputColor0": CIColor(red: 0, green: 0, blue: 0), "inputColor1": CIColor(red: 1, green: 1, blue: 1)])!.outputImage!
let m = mask.applyingFilter("CIMultiplyCompositing", parameters: [kCIInputBackgroundImageKey: mask2]).cropped(to: CGRect(x: 0, y: 0, width: nw, height: ch))
let out = placed.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: back, kCIInputMaskImageKey: m]).cropped(to: CGRect(x: 0, y: 0, width: nw, height: ch))
try CIContext().writeJPEGRepresentation(of: out, to: URL(fileURLWithPath: a[2]), colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!,
    options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.86])
print("wrote \(a[2])")
